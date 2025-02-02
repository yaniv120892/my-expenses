"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiServiceFactory_1 = __importDefault(require("./ai/aiServiceFactory"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const createTransactionValidator_1 = __importDefault(require("../validators/createTransactionValidator"));
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
class TransactionService {
    constructor() {
        this.aiService = aiServiceFactory_1.default.getAIService();
    }
    async createTransaction(data) {
        const createTransaction = await this.updateCategory(data);
        await createTransactionValidator_1.default.validate(createTransaction);
        const CreateTransactionDbModel = {
            description: createTransaction.description,
            value: createTransaction.value,
            date: createTransaction.date || new Date(),
            categoryId: createTransaction.categoryId,
            type: createTransaction.type,
        };
        return transactionRepository_1.default.createTransaction(CreateTransactionDbModel);
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
    updateTransaction(transactionId, updateData) {
        return transactionRepository_1.default.updateTransaction(transactionId, {
            description: updateData.description,
            value: updateData.value,
            date: updateData.date || undefined,
            categoryId: updateData.categoryId || undefined,
        });
    }
    async updateCategory(transaction) {
        if (transaction.categoryId) {
            return transaction;
        }
        const categories = await categoryRepository_1.default.getAllCategories();
        const suggestedCategoryId = await this.aiService.suggestCategory(transaction.description, categories);
        return Object.assign(Object.assign({}, transaction), { categoryId: suggestedCategoryId });
    }
}
exports.default = new TransactionService();
