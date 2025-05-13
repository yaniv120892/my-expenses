"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const scheduledTransactionService_1 = __importDefault(require("../services/scheduledTransactionService"));
class ScheduledTransactionController {
    async create(reqBody) {
        try {
            logger_1.default.debug('Start create scheduled transaction', reqBody);
            const result = await scheduledTransactionService_1.default.createScheduledTransaction(reqBody);
            logger_1.default.debug('Done create scheduled transaction', result);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to create scheduled transaction, ${JSON.stringify(reqBody)}, ${error.message}`);
            throw error;
        }
    }
    async update(id, reqBody) {
        try {
            logger_1.default.debug('Start update scheduled transaction', { id, reqBody });
            const result = await scheduledTransactionService_1.default.updateScheduledTransaction(id, reqBody);
            logger_1.default.debug('Done update scheduled transaction', result);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to update scheduled transaction ${id}, ${error.message}`);
            throw error;
        }
    }
    async list() {
        try {
            logger_1.default.debug('Start list scheduled transactions');
            const result = await scheduledTransactionService_1.default.listScheduledTransactions();
            logger_1.default.debug('Done list scheduled transactions', result);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to list scheduled transactions, ${error.message}`);
            throw error;
        }
    }
    async delete(id) {
        try {
            logger_1.default.debug('Start delete scheduled transaction', id);
            const result = await scheduledTransactionService_1.default.deleteScheduledTransaction(id);
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
