"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiServiceFactory_1 = __importDefault(require("./ai/aiServiceFactory"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const transactionFileRepository_1 = __importDefault(require("../repositories/transactionFileRepository"));
const createTransactionValidator_1 = __importDefault(require("../validators/createTransactionValidator"));
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
const transactionNotifierFactory_1 = __importDefault(require("./transactionNotification/transactionNotifierFactory"));
const userSettingsService_1 = __importDefault(require("../services/userSettingsService"));
const transactionAttachmentFileUtils_1 = require("./transactionAttachmentFileUtils");
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
            userId: createTransaction.userId,
        };
        const transactionId = await transactionRepository_1.default.createTransaction(CreateTransactionDbModel);
        await this.notifyTransactionCreatedSafe(transactionId, createTransaction.userId);
        return transactionId;
    }
    async getTransactions(filters) {
        return transactionRepository_1.default.getTransactions(Object.assign(Object.assign({}, filters), { status: filters.status || 'APPROVED' }));
    }
    async getAllTransactions(filters) {
        const transactions = [];
        let hasMoreTransactions = true;
        let page = 1;
        const perPage = 100;
        while (hasMoreTransactions) {
            const transactionsPage = await this.getTransactions(Object.assign(Object.assign({}, filters), { page,
                perPage }));
            transactions.push(...transactionsPage);
            if (transactionsPage.length < perPage) {
                hasMoreTransactions = false;
            }
            page++;
        }
        return transactions;
    }
    async getPendingTransactions(userId) {
        return transactionRepository_1.default.getPendingTransactions(userId);
    }
    async updateTransactionStatus(id, status, userId) {
        const transactionId = await transactionRepository_1.default.updateTransactionStatus(id, status, userId);
        if (status === 'APPROVED') {
            await this.notifyTransactionCreatedSafe(transactionId, userId);
        }
        return transactionId;
    }
    async getTransactionItem(transactionId, userId) {
        return transactionRepository_1.default.getTransactionItem(transactionId, userId);
    }
    async getTransactionsSummary(filters) {
        return transactionRepository_1.default.getTransactionsSummary(Object.assign(Object.assign({}, filters), { status: filters.status || 'APPROVED' }));
    }
    async updateTransaction(id, data, userId) {
        await transactionRepository_1.default.updateTransaction(id, data, userId);
    }
    async deleteTransaction(id, userId) {
        return transactionRepository_1.default.deleteTransaction(id, userId);
    }
    async attachFile(transactionId, userId, fileData) {
        // Verify transaction exists and belongs to user
        await this.assertTransactionExists(transactionId, userId);
        await transactionFileRepository_1.default.create(Object.assign({ transactionId }, fileData));
        logger_1.default.debug(`File attached to transaction ${transactionId}`, fileData);
    }
    async getTransactionFiles(transactionId, userId) {
        await this.assertTransactionExists(transactionId, userId);
        const files = await transactionFileRepository_1.default.findByTransactionId(transactionId);
        return Promise.all(files.map(async (file) => {
            const previewFileUrl = await (0, transactionAttachmentFileUtils_1.buildPreviewUrl)(file.fileKey);
            const downloadableFileUrl = await (0, transactionAttachmentFileUtils_1.buildDownloadUrl)(file.fileKey, file.fileName);
            return {
                id: file.id,
                fileName: file.fileName,
                previewFileUrl,
                downloadableFileUrl,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
            };
        }));
    }
    async removeFile(transactionId, fileId, userId) {
        await this.assertTransactionExists(transactionId, userId);
        await this.assertTransactionFileExists(fileId, transactionId);
        await transactionFileRepository_1.default.markForDeletion(fileId);
        logger_1.default.debug(`File ${fileId} marked for deletion from transaction ${transactionId}`);
    }
    async getPresignedUploadUrl(transactionId, userId, fileName, mimeType) {
        await this.assertTransactionExists(transactionId, userId);
        return (0, transactionAttachmentFileUtils_1.getPresignedUploadUrl)(transactionId, fileName, mimeType);
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
    async notifyTransactionCreatedSafe(transactionId, userId) {
        try {
            const transaction = await this.getTransactionItem(transactionId, userId);
            if (!transaction) {
                logger_1.default.warn(`skipped notification for transaction ${transactionId} - transaction not found`);
                return;
            }
            if (transaction.status !== 'APPROVED') {
                logger_1.default.debug(`skipped notification for transaction ${transactionId} - transaction not approved`);
                return;
            }
            const isNotificationEnabled = await userSettingsService_1.default.isCreateTransactionNotificationEnabled(userId);
            if (!isNotificationEnabled) {
                logger_1.default.debug(`skipped notification for transaction ${transactionId} - notification not enabled for user ${userId}`);
                return;
            }
            await this.transactionNotifier.notifyTransactionCreated(transaction, userId);
        }
        catch (error) {
            logger_1.default.error(`Failed to notify transaction created: ${transactionId} - ${error}`);
        }
    }
    async assertTransactionExists(transactionId, userId) {
        const transaction = await this.getTransactionItem(transactionId, userId);
        if (!transaction) {
            throw new Error('Transaction not found or access denied');
        }
        return transaction;
    }
    async assertTransactionFileExists(fileId, transactionId) {
        const file = await transactionFileRepository_1.default.findById(fileId);
        if (!file || file.transactionId !== transactionId) {
            throw new Error('File not found or access denied');
        }
        return file;
    }
}
exports.default = new TransactionService();
