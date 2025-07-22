"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
class TransactionController {
    async createTransaction(createTransactionRequest, userId) {
        try {
            logger_1.default.debug('Start create transaction', createTransactionRequest);
            const transactionId = await transactionService_1.default.createTransaction(Object.assign(Object.assign({}, createTransactionRequest), { date: createTransactionRequest.date || new Date(), categoryId: createTransactionRequest.categoryId || null, userId }));
            logger_1.default.debug('Done create transaction', createTransactionRequest, transactionId);
            return transactionId;
        }
        catch (error) {
            logger_1.default.error(`Failed to create transaction, ${JSON.stringify(createTransactionRequest)}, ${error.message}`);
            throw error;
        }
    }
    async getTransactions(getTransactionsRequest, userId) {
        try {
            logger_1.default.debug('Start get transactions', getTransactionsRequest);
            const transactions = await transactionService_1.default.getTransactions(Object.assign(Object.assign({}, getTransactionsRequest), { startDate: getTransactionsRequest.startDate
                    ? new Date(getTransactionsRequest.startDate)
                    : undefined, endDate: getTransactionsRequest.endDate
                    ? new Date(getTransactionsRequest.endDate)
                    : undefined, transactionType: getTransactionsRequest.type, userId, smartSearch: getTransactionsRequest.smartSearch !== undefined
                    ? getTransactionsRequest.smartSearch
                    : true }));
            logger_1.default.debug('Done get transactions', getTransactionsRequest, transactions);
            return transactions;
        }
        catch (error) {
            logger_1.default.error(`Failed to get transactions, ${error.message}`);
            throw error;
        }
    }
    async getSummary(getTransactionsRequest, userId) {
        try {
            logger_1.default.debug('Start get transactions summary', getTransactionsRequest);
            const summary = await transactionService_1.default.getTransactionsSummary(Object.assign(Object.assign({}, getTransactionsRequest), { userId }));
            logger_1.default.debug('Done get transactions summary', getTransactionsRequest, summary);
            return summary;
        }
        catch (error) {
            logger_1.default.error(`Failed to get transactions summary, ${error.message}`);
            throw error;
        }
    }
    async updateTransaction(id, updateTransactionRequest, userId) {
        try {
            logger_1.default.debug('Start update transaction', id, updateTransactionRequest);
            const transactionId = await transactionService_1.default.updateTransaction(id, updateTransactionRequest, userId);
            logger_1.default.debug('Done update transaction', id, transactionId);
            return transactionId;
        }
        catch (error) {
            logger_1.default.error(`Failed to update transaction ${id}, ${error.message}`);
            throw error;
        }
    }
    async deleteTransaction(id, userId) {
        try {
            logger_1.default.debug('Start delete transaction', id);
            await transactionService_1.default.deleteTransaction(id, userId);
            logger_1.default.debug('Done delete transaction', id);
            return;
        }
        catch (error) {
            logger_1.default.error(`Failed to delete transaction ${id}, ${error.message}`);
            throw error;
        }
    }
    async getPendingTransactions(userId) {
        try {
            logger_1.default.debug('Start get pending transactions');
            const transactions = await transactionService_1.default.getPendingTransactions(userId);
            logger_1.default.debug('Done get pending transactions', transactions);
            return transactions;
        }
        catch (error) {
            logger_1.default.error(`Failed to get pending transactions, ${error.message}`);
            throw error;
        }
    }
    async updateTransactionStatus(id, status, userId) {
        try {
            logger_1.default.debug('Start update transaction status', { id, status });
            const transactionId = await transactionService_1.default.updateTransactionStatus(id, status, userId);
            logger_1.default.debug('Done update transaction status', { id, status });
            return transactionId;
        }
        catch (error) {
            logger_1.default.error(`Failed to update transaction status for ${id}, ${error.message}`);
            throw error;
        }
    }
}
exports.default = new TransactionController();
