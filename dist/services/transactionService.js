"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionRepository_1 = __importDefault(require("..//repositories/transactionRepository"));
const createTransactionValidator_1 = __importDefault(require("..//validators/createTransactionValidator"));
class TransactionService {
    async createTransaction(data) {
        await createTransactionValidator_1.default.validate(data);
        return transactionRepository_1.default.createTransaction(data);
    }
    async getTransactions(filters) {
        return transactionRepository_1.default.getTransactions(filters);
    }
    async getTransactionItem(data) {
        return transactionRepository_1.default.getTransactionItem(data);
    }
    async getTransactionsSummary(filters) {
        return transactionRepository_1.default.getTransactionsSummary(filters);
    }
    async deleteTransaction(transactionId) {
        return transactionRepository_1.default.deleteTransaction(transactionId);
    }
}
exports.default = new TransactionService();
