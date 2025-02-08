"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiServiceFactory_1 = __importDefault(require("./ai/aiServiceFactory"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const createTransactionValidator_1 = __importDefault(require("../validators/createTransactionValidator"));
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
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
    async updateCategory(transaction) {
        if (transaction.categoryId) {
            return transaction;
        }
        const categories = await categoryRepository_1.default.getAllCategories();
        const suggestedCategoryId = await this.getSuggestedCategory(transaction.description, categories);
        return Object.assign(Object.assign({}, transaction), { categoryId: suggestedCategoryId });
    }
    async getSuggestedCategory(description, categories) {
        let categoryFoundUsingCategorizer = false;
        let category = null;
        try {
            category = await this.categorizeExpense(description);
            if (category && categories.find((c) => c.name === category)) {
                categoryFoundUsingCategorizer = true;
            }
        }
        catch (err) {
            logger_1.default.warn(`Failed to categorize expense: ${description}`);
        }
        if (categoryFoundUsingCategorizer) {
            return category;
        }
        return this.aiService.suggestCategory(description, categories);
    }
    async categorizeExpense(description) {
        const expenseCategorizerBaseUrl = process.env.EXPENSE_CATEGORIZER_BASE_URL;
        const response = await axios_1.default.post(`${expenseCategorizerBaseUrl}/predict`, {
            description,
        });
        logger_1.default.debug(`Done categorizing expense: ${description}`);
        if (!response.data.category) {
            logger_1.default.error('No category found for expense using categorizer.');
            return null;
        }
        return response.data.category;
    }
}
exports.default = new TransactionService();
