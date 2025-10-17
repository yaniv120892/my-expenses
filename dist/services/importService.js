"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const importRepository_1 = require("../repositories/importRepository");
const importedTransactionRepository_1 = require("../repositories/importedTransactionRepository");
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const transactionService_1 = __importDefault(require("./transactionService"));
const excelExtractionAgentClient_1 = require("../clients/excelExtractionAgentClient");
const client_2 = __importDefault(require("../prisma/client"));
const aiServiceFactory_1 = __importDefault(require("./ai/aiServiceFactory"));
class ImportService {
    constructor() {
        this.aiProvider = aiServiceFactory_1.default.getAIService();
    }
    async processImport(fileUrl, userId, originalFileName, paymentMonthFromRequest) {
        try {
            logger_1.default.info('Starting import with excel extraction agent', {
                userId,
                originalFileName,
                fileUrl: fileUrl.substring(0, 100),
            });
            const importRecord = await importRepository_1.importRepository.create({
                fileUrl,
                originalFileName,
                userId,
                importType: null,
                bankSourceType: null,
                creditCardLastFourDigits: null,
                paymentMonth: paymentMonthFromRequest || null,
                excelExtractionRequestId: null,
            });
            logger_1.default.info('Created import record', {
                importId: importRecord.id,
                userId,
            });
            try {
                const extractionResponse = await excelExtractionAgentClient_1.excelExtractionAgentClient.submitExtractionRequest({
                    fileUrl,
                    filename: originalFileName,
                    userId,
                    options: {
                        confidenceThreshold: 0.7,
                        maxRetries: 3,
                        includeRawData: false,
                    },
                });
                logger_1.default.info('Extraction request submitted', {
                    importId: importRecord.id,
                    extractionRequestId: extractionResponse.requestId,
                });
                await importRepository_1.importRepository.updateStatus(importRecord.id, client_1.ImportStatus.PROCESSING);
                await this.updateImportWithExtractionRequestId(importRecord.id, extractionResponse.requestId);
                return importRecord;
            }
            catch (error) {
                logger_1.default.error('Failed to submit extraction request', {
                    importId: importRecord.id,
                    error,
                });
                await importRepository_1.importRepository.updateStatus(importRecord.id, client_1.ImportStatus.FAILED, error instanceof Error
                    ? error.message
                    : 'Failed to submit extraction request');
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error('Error processing import:', error);
            throw error;
        }
    }
    async updateImportWithExtractionRequestId(importId, extractionRequestId) {
        await client_2.default.import.update({
            where: { id: importId },
            data: { excelExtractionRequestId: extractionRequestId },
        });
    }
    async getImports(userId) {
        return importRepository_1.importRepository.findByUserId(userId);
    }
    async getImportedTransactions(importId, userId) {
        return importedTransactionRepository_1.importedTransactionRepository.findByUserIdAndImportId(userId, importId);
    }
    async approveImportedTransaction(importedTransactionId, userId, transactionData) {
        const importedTransaction = await importedTransactionRepository_1.importedTransactionRepository.findById(importedTransactionId);
        if (!importedTransaction || importedTransaction.userId !== userId) {
            throw new Error('Imported transaction not found with id: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        await transactionService_1.default.createTransaction({
            description: transactionData.description,
            value: transactionData.value,
            date: transactionData.date,
            type: transactionData.type,
            userId: importedTransaction.userId,
            status: client_1.TransactionStatus.APPROVED,
            categoryId: transactionData.categoryId,
        });
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.APPROVED);
    }
    async mergeImportedTransaction(importedTransactionId, userId, transactionData) {
        const importedTransaction = await importedTransactionRepository_1.importedTransactionRepository.findById(importedTransactionId);
        if (!importedTransaction || importedTransaction.userId !== userId) {
            throw new Error('Imported transaction not found with id: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        if (!importedTransaction.matchingTransactionId) {
            throw new Error('No matching transaction found to merge with; importedTransactionId: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        const matchingTransaction = await transactionRepository_1.default.getTransactionItem(importedTransaction.matchingTransactionId, userId);
        if (!matchingTransaction) {
            throw new Error('Matching transaction not found with id: ' +
                importedTransaction.matchingTransactionId +
                ' and userId: ' +
                userId);
        }
        await transactionService_1.default.updateTransaction(importedTransaction.matchingTransactionId, {
            description: transactionData.description,
            type: transactionData.type,
            value: transactionData.value,
            date: transactionData.date,
            categoryId: transactionData.categoryId,
        }, userId);
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.MERGED);
    }
    async ignoreImportedTransaction(importedTransactionId, userId) {
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.IGNORED);
    }
    async deleteImportedTransaction(importedTransactionId, userId) {
        await importedTransactionRepository_1.importedTransactionRepository.softDelete(importedTransactionId, userId);
    }
    async findPotentialMatchesForImport(importId, userId) {
        try {
            logger_1.default.info('Finding potential matches for import', {
                importId,
                userId,
            });
            const importedTransactions = await importedTransactionRepository_1.importedTransactionRepository.findByImportId(importId);
            logger_1.default.info('Processing imported transactions for matches', {
                importId,
                count: importedTransactions.length,
            });
            await Promise.all(importedTransactions.map(async (transaction) => {
                var _a, _b;
                try {
                    const matches = await transactionRepository_1.default.findPotentialMatches(userId, transaction.date, transaction.value);
                    let matchingTransactionId = null;
                    if (matches.length > 0) {
                        logger_1.default.debug('Found potential matches for transaction', {
                            transactionId: transaction.id,
                            matchCount: matches.length,
                        });
                        const bestMatchId = await this.aiProvider.findMatchingTransaction(transaction.description, matches);
                        matchingTransactionId = (_b = bestMatchId !== null && bestMatchId !== void 0 ? bestMatchId : (_a = matches[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
                        logger_1.default.debug('Selected matching transaction', {
                            transactionId: transaction.id,
                            matchingTransactionId,
                            usedAI: !!bestMatchId,
                        });
                    }
                    if (matchingTransactionId) {
                        await client_2.default.importedTransaction.update({
                            where: { id: transaction.id },
                            data: { matchingTransactionId },
                        });
                    }
                }
                catch (error) {
                    logger_1.default.error('Error finding match for transaction', {
                        transactionId: transaction.id,
                        error,
                    });
                    // Continue processing other transactions even if one fails
                }
            }));
            logger_1.default.info('Completed finding potential matches', {
                importId,
            });
        }
        catch (error) {
            logger_1.default.error('Error finding potential matches for import', {
                importId,
                error,
            });
            throw error;
        }
    }
}
exports.importService = new ImportService();
