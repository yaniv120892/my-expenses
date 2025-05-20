"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const scheduledTransactionService_1 = __importDefault(require("../services/scheduledTransactionService"));
class ScheduledTransactionController {
    async create(request, userId) {
        try {
            logger_1.default.debug('Start create scheduled transaction', request);
            const result = await scheduledTransactionService_1.default.createScheduledTransaction(Object.assign(Object.assign({}, request), { userId }));
            logger_1.default.debug('Done create scheduled transaction', result);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to create scheduled transaction, ${JSON.stringify(request)}, ${error.message}`);
            throw error;
        }
    }
    async update(id, request, userId) {
        try {
            logger_1.default.debug('Start update scheduled transaction', { id, reqBody: request });
            const result = await scheduledTransactionService_1.default.updateScheduledTransaction(id, request, userId);
            logger_1.default.debug('Done update scheduled transaction', result);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to update scheduled transaction ${id}, ${error.message}`);
            throw error;
        }
    }
    async list(userId) {
        try {
            logger_1.default.debug('Start list scheduled transactions', { userId });
            const result = await scheduledTransactionService_1.default.listScheduledTransactions(userId);
            logger_1.default.debug('Done list scheduled transactions', result);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to list scheduled transactions, ${error.message}`);
            throw error;
        }
    }
    async delete(id, userId) {
        try {
            logger_1.default.debug('Start delete scheduled transaction', id);
            const result = await scheduledTransactionService_1.default.deleteScheduledTransaction(id, userId);
            logger_1.default.debug('Done delete scheduled transaction', id);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to delete scheduled transaction ${id}, ${error.message}`);
            throw error;
        }
    }
}
exports.default = new ScheduledTransactionController();
