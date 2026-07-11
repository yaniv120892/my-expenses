"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolRegistry = void 0;
class AgentToolRegistry {
    constructor(dependencies) {
        const defaultDependencies = dependencies
            ? undefined
            : this.createDefaultDependencies();
        this.transactionService =
            (dependencies === null || dependencies === void 0 ? void 0 : dependencies.transactionService) ||
                defaultDependencies.transactionService;
        this.categoryRepository =
            (dependencies === null || dependencies === void 0 ? void 0 : dependencies.categoryRepository) ||
                defaultDependencies.categoryRepository;
        this.agentRepository =
            (dependencies === null || dependencies === void 0 ? void 0 : dependencies.agentRepository) ||
                defaultDependencies.agentRepository;
    }
    getToolNames() {
        return [
            'search_transactions',
            'get_transaction_summary',
            'list_categories',
            'create_transaction_draft',
        ];
    }
    async executeTool(request) {
        switch (request.name) {
            case 'search_transactions':
                return this.searchTransactions(request);
            case 'get_transaction_summary':
                return this.getTransactionSummary(request);
            case 'list_categories':
                return this.listCategories();
            case 'create_transaction_draft':
                return this.createTransactionDraft(request);
        }
    }
    async confirmPendingAction(pendingActionId, userId) {
        const pendingAction = await this.agentRepository.getPendingAction(pendingActionId, userId);
        if (!pendingAction) {
            throw new Error('Pending action not found.');
        }
        if (pendingAction.status !== 'PENDING') {
            throw new Error('Pending action was already resolved.');
        }
        if (pendingAction.type !== 'CREATE_TRANSACTION') {
            throw new Error('Unsupported pending action type.');
        }
        const payload = pendingAction.payload;
        const result = await this.transactionService.createTransaction({
            description: payload.description,
            value: payload.value,
            date: new Date(payload.date),
            categoryId: payload.categoryId,
            type: payload.type,
            userId,
        });
        await this.agentRepository.markPendingActionConfirmed(pendingActionId, result.id);
        return { transactionId: result.id };
    }
    async searchTransactions(request) {
        const args = request.arguments;
        const transactions = await this.transactionService.getTransactions({
            userId: request.userId,
            page: this.getPositiveInteger(args.page, 1),
            perPage: Math.min(this.getPositiveInteger(args.perPage, 10), 25),
            startDate: this.getOptionalDate(args.startDate),
            endDate: this.getOptionalDate(args.endDate),
            categoryId: this.getOptionalString(args.categoryId),
            transactionType: this.getOptionalTransactionType(args.transactionType),
            searchTerm: this.getOptionalString(args.searchTerm),
            smartSearch: true,
        });
        return {
            summary: `Found ${transactions.length} matching transactions.`,
            data: { transactions },
        };
    }
    async getTransactionSummary(request) {
        const args = request.arguments;
        const summary = await this.transactionService.getTransactionsSummary({
            userId: request.userId,
            startDate: this.getOptionalDate(args.startDate),
            endDate: this.getOptionalDate(args.endDate),
            categoryId: this.getOptionalString(args.categoryId),
            transactionType: this.getOptionalTransactionType(args.transactionType),
        });
        return {
            summary: `Income: ${summary.totalIncome}, expenses: ${summary.totalExpense}.`,
            data: { summary },
        };
    }
    async listCategories() {
        const categories = await this.categoryRepository.getAllCategories();
        return {
            summary: `Found ${categories.length} categories.`,
            data: { categories },
        };
    }
    async createTransactionDraft(request) {
        const payload = await this.getCreateTransactionPayload(request.arguments);
        const pendingAction = await this.agentRepository.createPendingAction(request.conversationId, request.userId, 'CREATE_TRANSACTION', payload);
        return {
            summary: 'Created a pending transaction action. User confirmation is required before writing.',
            data: { pendingActionId: pendingAction.id },
            pendingAction,
        };
    }
    async getCreateTransactionPayload(args) {
        const description = this.getRequiredString(args.description, 'description');
        const value = this.getRequiredNumber(args.value, 'value');
        const date = this.getRequiredDateString(args.date, 'date');
        const type = this.getRequiredTransactionType(args.type);
        const categoryId = this.getOptionalString(args.categoryId) ||
            (await this.resolveCategoryId(this.getOptionalString(args.categoryName)));
        if (!categoryId) {
            throw new Error('A valid category is required to create a transaction.');
        }
        return {
            description,
            value,
            date,
            type,
            categoryId,
        };
    }
    async resolveCategoryId(categoryName) {
        if (!categoryName) {
            return undefined;
        }
        const lowerCategoryName = categoryName.toLowerCase();
        const categories = await this.categoryRepository.getAllCategories();
        const category = categories.find((currentCategory) => currentCategory.name.toLowerCase() === lowerCategoryName);
        return category === null || category === void 0 ? void 0 : category.id;
    }
    getRequiredString(value, fieldName) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${fieldName} is required.`);
        }
        return value.trim();
    }
    getOptionalString(value) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return undefined;
        }
        return value.trim();
    }
    getRequiredNumber(value, fieldName) {
        if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
            throw new Error(`${fieldName} must be a positive number.`);
        }
        return value;
    }
    getPositiveInteger(value, fallback) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
            return fallback;
        }
        return value;
    }
    getRequiredDateString(value, fieldName) {
        const date = this.getOptionalDate(value);
        if (!date) {
            throw new Error(`${fieldName} must be a valid date.`);
        }
        return date.toISOString().slice(0, 10);
    }
    getOptionalDate(value) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return undefined;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return undefined;
        }
        return date;
    }
    getRequiredTransactionType(value) {
        const type = this.getOptionalTransactionType(value);
        if (!type) {
            throw new Error('type must be INCOME or EXPENSE.');
        }
        return type;
    }
    getOptionalTransactionType(value) {
        if (value === 'INCOME' || value === 'EXPENSE') {
            return value;
        }
        return undefined;
    }
    createDefaultDependencies() {
        const transactionServiceModule = require('../transactionService');
        const categoryRepositoryModule = require('../../repositories/categoryRepository');
        const agentRepositoryModule = require('../../repositories/agentRepository');
        return {
            transactionService: transactionServiceModule.default,
            categoryRepository: categoryRepositoryModule.default,
            agentRepository: agentRepositoryModule.default,
        };
    }
}
exports.AgentToolRegistry = AgentToolRegistry;
exports.default = AgentToolRegistry;
