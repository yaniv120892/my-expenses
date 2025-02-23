"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
class TransactionController {
    async createTransaction(createTransactionRequest) {
        try {
            logger_1.default.debug('Start create transaction', createTransactionRequest);
            const transactionId = await transactionService_1.default.createTransaction(Object.assign(Object.assign({}, createTransactionRequest), { date: createTransactionRequest.date || new Date() }));
            logger_1.default.debug('Done create transaction', createTransactionRequest, transactionId);
            return transactionId;
        }
        catch (error) {
            logger_1.default.error(`Failed to create transaction, ${JSON.stringify(createTransactionRequest)}, ${error.message}`);
            throw error;
        }
    }
    async getTransactions(getTransactionsRequest) {
        try {
            logger_1.default.debug('Start get transactions', getTransactionsRequest);
            const transactions = await transactionService_1.default.getTransactions(getTransactionsRequest);
            logger_1.default.debug('Done get transactions', getTransactionsRequest, transactions);
            return transactions;
        }
        catch (error) {
            logger_1.default.error(`Failed to get transactions, ${error.message}`);
            throw error;
        }
    }
    async getSummary(getTransactionsRequest) {
        try {
            logger_1.default.debug('Start get transactions summary', getTransactionsRequest);
            const summary = await transactionService_1.default.getTransactionsSummary(getTransactionsRequest);
            logger_1.default.debug('Done get transactions summary', getTransactionsRequest, summary);
            return summary;
        }
        catch (error) {
            logger_1.default.error(`Failed to get transactions summary, ${error.message}`);
            throw error;
        }
    }
}
exports.default = new TransactionController();
