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
const transactionNotifierFactory_1 = __importDefault(require("./transactionNotification/transactionNotifierFactory"));
class TransactionService {
    constructor() {
        this.aiService = aiServiceFactory_1.default.getAIService();
        this.transactionNotifier = transactionNotifierFactory_1.default.getNotifier();
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
            status: createTransaction.status || 'APPROVED',
        };
        const transactionId = await transactionRepository_1.default.createTransaction(CreateTransactionDbModel);
        await this.notifyTransactionCreatedSafe(transactionId);
        return transactionId;
    }
    async getTransactions(filters) {
        return transactionRepository_1.default.getTransactions(Object.assign(Object.assign({}, filters), { status: filters.status || 'APPROVED' }));
    }
    async getPendingTransactions() {
        return transactionRepository_1.default.getPendingTransactions();
    }
    async updateTransactionStatus(id, status) {
        const transactionId = await transactionRepository_1.default.updateTransactionStatus(id, status);
        if (status === 'APPROVED') {
            await this.notifyTransactionCreatedSafe(transactionId);
        }
        return transactionId;
    }
    async getTransactionItem(data) {
        return transactionRepository_1.default.getTransactionItem(data);
    }
    async getTransactionsSummary(filters) {
        return transactionRepository_1.default.getTransactionsSummary(Object.assign(Object.assign({}, filters), { status: filters.status || 'APPROVED' }));
    }
    async updateTransaction(id, data) {
        await transactionRepository_1.default.updateTransaction(id, data);
    }
    async deleteTransaction(id) {
        return transactionRepository_1.default.deleteTransaction(id);
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
        var _a;
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
            logger_1.default.debug(`Categorizer found category for expense: ${description} - ${category}`);
            return (_a = categories.find((c) => c.name === category)) === null || _a === void 0 ? void 0 : _a.id;
        }
        logger_1.default.warn(`No category found for expense using categorizer. Using AI service instead.`);
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
    async notifyTransactionCreatedSafe(transactionId) {
        try {
            const transaction = await this.getTransactionItem({ id: transactionId });
            if (!transaction) {
                logger_1.default.warn(`skipped notification for transaction ${transactionId} - transaction not found`);
                return;
            }
            if (transaction.status !== 'APPROVED') {
                logger_1.default.warn(`skipped notification for transaction ${transactionId} - transaction not approved`);
                return;
            }
            await this.transactionNotifier.notifyTransactionCreated(transaction);
        }
        catch (error) {
            logger_1.default.error(`Failed to notify transaction created: ${transactionId} - ${error}`);
        }
    }
}
exports.default = new TransactionService();
