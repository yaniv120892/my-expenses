"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = void 0;
const transactionManager_1 = require("../services/transactionManager");
const logger_1 = __importDefault(require("../utils/logger"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
const categoryService_1 = __importDefault(require("../services/categoryService"));
const aiServiceFactory_1 = __importDefault(require("../services/ai/aiServiceFactory"));
class WebhookController {
    constructor() {
        this.aiService = aiServiceFactory_1.default.getAIService();
    }
    async handleWebhook(req) {
        var _a;
        const chatId = req.message.chat.id;
        const text = (_a = req.message.text) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim();
        if (!text)
            return this.createResponse('Please enter a valid command.');
        const [command, ...args] = text.split(' ');
        try {
            switch (command) {
                case '/start':
                    return this.handleStart(chatId);
                case '/help':
                    return this.handleHelp(chatId);
                case '/create':
                    return await this.handleCreate(chatId);
                case '/list':
                    return await this.handleList(chatId, args);
                case '/summary':
                    return await this.handleSummary(chatId);
                case '/categories':
                    return await this.handleCategories(chatId);
                case '/delete':
                    return await this.handleDelete(chatId, args);
                case '/reset':
                    return this.handleReset(chatId);
                case '/insights':
                    return await this.handleInsights();
                default:
                    return await this.handleUserState(chatId, text);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to handle webhook:', error);
            return this.createResponse(`Failed to handle command: ${command}`);
        }
    }
    /** Helper to create response messages with available options */
    createResponse(message, showOptions = true) {
        return {
            message: showOptions
                ? `${message}\n\n${this.getOptionsMessage()}`
                : message,
        };
    }
    /** Returns the options menu */
    getOptionsMessage() {
        return `Available commands:
1. /create - Create a new transaction.
2. /list <days> - List transactions from the last <days> days (default: 10).
3. /summary - Get a summary of your transactions.
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
6. /reset - Reset user state.
7. /insights - Get AI-generated expense insights.
8. /help - Show available commands.`;
    }
    /** Handles /start command */
    handleStart(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return this.createResponse(`Welcome to the transaction bot. You can manage your expenses using the commands below.`);
    }
    /** Handles /help command */
    handleHelp(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return this.createResponse(`Here are the available commands.`);
    }
    /** Handles /create command */
    async handleCreate(chatId) {
        const { message, nextStep } = await transactionManager_1.transactionManager.handleUserState(chatId, '/create');
        return this.createResponse(message, nextStep !== transactionManager_1.UserStatus.FAILURE);
    }
    /** Handles /list <days> command */
    async handleList(chatId, args) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        const days = args.length ? parseInt(args[0]) || 10 : 10;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const transactions = await transactionService_1.default.getTransactions({
            startDate,
            transactionType: 'EXPENSE',
            page: 1,
            perPage: 10,
        });
        if (transactions.length === 0) {
            return this.createResponse('No transactions found.');
        }
        const transactionList = transactions
            .map((t) => `*Description*: ${t.description}
*Value*: ${t.value} 
*Date*: ${new Date(t.date).toISOString().split('T')[0]}
*Type*: ${t.type}
*Category*: ${t.category.name}`)
            .join('\n\n');
        return this.createResponse(transactionList);
    }
    /** Handles /summary command */
    async handleSummary(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        const summary = await transactionService_1.default.getTransactionsSummary({});
        return this.createResponse(`Transaction Summary:\n*Total Income*: ${summary.totalIncome}\n*Total Expense*: ${summary.totalExpense}`);
    }
    /** Handles /categories command */
    async handleCategories(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        const categories = await categoryService_1.default.list();
        if (categories.length === 0) {
            return this.createResponse('No categories found.');
        }
        const categoryList = categories
            .map((c) => `*${c.id}*: ${c.name}`)
            .join('\n');
        return this.createResponse(`Available Categories:\n${categoryList}`);
    }
    /** Handles /delete <transaction_id> command */
    async handleDelete(chatId, args) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        if (!args.length) {
            return this.createResponse('Please provide a transaction ID to delete.');
        }
        const transactionId = args[0];
        try {
            await transactionService_1.default.deleteTransaction(transactionId);
            return this.createResponse(`Transaction ${transactionId} deleted successfully.`);
        }
        catch (error) {
            logger_1.default.error(`Failed to delete transaction ${transactionId}`, error);
            return this.createResponse(`Failed to delete transaction ${transactionId}.`);
        }
    }
    /** Handles /reset command */
    handleReset(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return this.createResponse('State has been reset.');
    }
    /** Handles /insights command */
    async handleInsights() {
        const transactions = await transactionService_1.default.getTransactions({
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
            transactionType: 'EXPENSE',
            page: 1,
            perPage: 100,
        });
        if (transactions.length === 0) {
            return this.createResponse('No transactions found.');
        }
        const expenseSummary = transactions
            .map((t) => `${t.date.toISOString().split('T')[0]} - ${t.description}: $${t.value}`)
            .join('\n');
        const insights = await this.aiService.analyzeExpenses(expenseSummary);
        return this.createResponse(`💡 Expense Insights:\n${insights}`);
    }
    /** Handles user state progression (handles transaction creation flow) */
    async handleUserState(chatId, text) {
        logger_1.default.debug(`Handling user state for chatId: ${chatId}, text: ${text}`);
        const sanitizedText = text.replace('/', '').trim();
        const { message, nextStep } = await transactionManager_1.transactionManager.handleUserState(chatId, sanitizedText);
        let response = { message: 'Failed to handle user state.' };
        switch (nextStep) {
            case transactionManager_1.UserStatus.AWAITING_AMOUNT:
            case transactionManager_1.UserStatus.AWAITING_DESCRIPTION:
            case transactionManager_1.UserStatus.AWAITING_DATE:
                response = this.createResponse(message, false);
            case transactionManager_1.UserStatus.TRANSACTION_COMPLETE:
                response = this.createResponse(message, true);
            case transactionManager_1.UserStatus.FAILURE:
                response = this.createResponse('❌ Transaction failed. Please try again.', true);
        }
        logger_1.default.debug(`User state response: ${response.message}`);
        return response;
    }
}
exports.webhookController = new WebhookController();
