"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excelExtractionWebhookController = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const webhookAuth_1 = require("../utils/webhookAuth");
const importRepository_1 = require("../repositories/importRepository");
const importedTransactionRepository_1 = require("../repositories/importedTransactionRepository");
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const importService_1 = require("../services/importService");
class ExcelExtractionWebhookController {
    async handleWebhook(req, res) {
        const webhookPayload = req.body;
        try {
            logger_1.default.info('Received excel extraction webhook', {
                requestId: webhookPayload.requestId,
                status: webhookPayload.status,
            });
            const authParams = (0, webhookAuth_1.extractWebhookParams)(req.query);
            if (!authParams) {
                logger_1.default.error('Missing authentication parameters in webhook', {
                    requestId: webhookPayload.requestId,
                });
                res.status(401).json({
                    success: false,
                    error: 'Missing authentication parameters',
                });
                return;
            }
            const isValid = (0, webhookAuth_1.verifyWebhookToken)(authParams.token, authParams.userId, authParams.timestamp);
            if (!isValid) {
                logger_1.default.error('Invalid webhook authentication', {
                    requestId: webhookPayload.requestId,
                    userId: authParams.userId,
                });
                res.status(401).json({
                    success: false,
                    error: 'Invalid authentication',
                });
                return;
            }
            const importRecord = await importRepository_1.importRepository.findByExtractionRequestId(webhookPayload.requestId);
            if (!importRecord) {
                logger_1.default.error('Import record not found for extraction request', {
                    requestId: webhookPayload.requestId,
                });
                res.status(404).json({
                    success: false,
                    error: 'Import record not found',
                });
                return;
            }
            if (importRecord.userId !== authParams.userId) {
                logger_1.default.error('User ID mismatch in webhook', {
                    requestId: webhookPayload.requestId,
                    expectedUserId: importRecord.userId,
                    receivedUserId: authParams.userId,
                });
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized access',
                });
                return;
            }
            switch (webhookPayload.status) {
                case 'COMPLETED':
                    await this.handleCompletedExtraction(importRecord.id, webhookPayload);
                    break;
                case 'FAILED':
                    await this.handleFailedExtraction(importRecord.id, webhookPayload);
                    break;
                default:
                    throw new Error(`Invalid webhook status: ${webhookPayload.status}`);
            }
            logger_1.default.info('Webhook processed successfully', {
                requestId: webhookPayload.requestId,
                importId: importRecord.id,
                status: webhookPayload.status,
            });
            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error processing webhook', {
                error,
                requestId: webhookPayload.requestId,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to process webhook',
            });
        }
    }
    async handleCompletedExtraction(importId, payload) {
        if (!payload.result) {
            throw new Error('Missing extraction result in completed webhook');
        }
        const { result } = payload;
        logger_1.default.info('Processing completed extraction', {
            importId,
            transactionCount: result.transactions.length,
            creditCardLastFour: result.metadata.creditCardLastFour,
            paymentMonth: result.metadata.paymentMonth,
        });
        const transactions = result.transactions.map((transaction) => {
            const [day, month, year] = transaction.date.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            return {
                description: transaction.description,
                value: transaction.value,
                date,
                type: transaction.type,
                rawData: transaction.rawData || {},
                matchingTransactionId: null,
                importId,
            };
        });
        // Get userId from import record
        const importRecord = await importRepository_1.importRepository.findById(importId);
        if (!importRecord) {
            throw new Error(`Import record not found: ${importId}`);
        }
        await client_2.default.import.update({
            where: { id: importId },
            data: {
                creditCardLastFourDigits: result.metadata.creditCardLastFour,
                paymentMonth: result.metadata.paymentMonth,
                bankSourceType: result.metadata
                    .bankSourceType,
            },
        });
        if (transactions.length > 0) {
            await importedTransactionRepository_1.importedTransactionRepository.createMany(transactions.map((transaction) => (Object.assign(Object.assign({}, transaction), { userId: importRecord.userId }))));
            // Find potential matches for imported transactions
            try {
                await importService_1.importService.findPotentialMatchesForImport(importId, importRecord.userId);
            }
            catch (error) {
                logger_1.default.error('Error finding potential matches for import', {
                    importId,
                    error,
                });
                // Continue processing even if matching fails
            }
        }
        await importRepository_1.importRepository.updateStatus(importId, client_1.ImportStatus.COMPLETED);
        logger_1.default.info('Completed extraction processed successfully', {
            importId,
            transactionCount: transactions.length,
        });
    }
    async handleFailedExtraction(importId, payload) {
        const errorMessage = payload.error || 'Unknown extraction error';
        logger_1.default.error('Processing failed extraction', {
            importId,
            error: errorMessage,
        });
        await importRepository_1.importRepository.updateStatus(importId, client_1.ImportStatus.FAILED, errorMessage);
        logger_1.default.info('Failed extraction processed', {
            importId,
            error: errorMessage,
        });
    }
}
exports.excelExtractionWebhookController = new ExcelExtractionWebhookController();
