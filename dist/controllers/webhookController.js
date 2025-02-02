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
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const defaultListDays = 5;
const defaultSummaryDays = 30;
class WebhookController {
    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
        this.bot = new node_telegram_bot_api_1.default(token);
        this.aiService = aiServiceFactory_1.default.getAIService();
    }
    async handleWebhook(req) {
        var _a;
        const chatId = req.message.chat.id;
        const text = (_a = req.message.text) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim();
        if (!text) {
            const message = this.createResponse('Please enter a valid command.');
            await this.bot.sendMessage(chatId, message.message);
        }
        const [command, ...args] = text.split(' ');
        let responseMessage;
        try {
            switch (command) {
                case '/start':
                    responseMessage = this.handleStart(chatId);
                    break;
                case '/search':
                    responseMessage = await this.handleSearch(chatId, args);
                    break;
                case '/help':
                    responseMessage = this.handleHelp(chatId);
                    break;
                case '/create':
                    responseMessage = await this.handleCreate(chatId);
                    break;
                case '/list':
                    responseMessage = await this.handleList(chatId, args);
                    break;
                case '/summary':
                    responseMessage = await this.handleSummary(chatId, args);
                    break;
                case '/categories':
                    responseMessage = await this.handleCategories(chatId);
                    break;
                case '/delete':
                    responseMessage = await this.handleDelete(chatId, args);
                    break;
                case '/update':
                    responseMessage = await this.handleUpdate(chatId, args);
                    break;
                case '/insights':
                    responseMessage = await this.handleInsights(chatId);
                    break;
                case '/reset':
                    responseMessage = this.handleReset(chatId);
                    break;
                default:
                    responseMessage = await this.handleUserState(chatId, text);
                    break;
            }
            await this.bot.sendMessage(chatId, responseMessage.message);
        }
        catch (error) {
            logger_1.default.error('Failed to handle webhook:', error);
            const message = this.createResponse('Failed to handle the request.');
            await this.bot.sendMessage(chatId, message.message);
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
2. /list <days> - List transactions from the last <days> days (default: ${defaultListDays}).
3. /summary <days> - Get a summary of your transactions from the last <days> days (default: ${defaultSummaryDays}).
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
7. /insights - Get AI-generated expense insights.
8. /search <keyword> - Search transactions by keyword.`;
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
        const days = args.length
            ? parseInt(args[0]) || defaultListDays
            : defaultListDays;
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
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .map((t) => {
            const formattedDate = new Date(t.date).toISOString().split('T')[0];
            return `\u200F${this.getTransactionTypeIcon(t.type)} ${t.description} ${t.value}
\u200Fקטגוריה: ${t.category.name}
\u200F${formattedDate}

🗑 /delete ${t.id}
✏️ /update ${t.id}`;
        })
            .join('\n\n');
        return this.createResponse(transactionList);
    }
    /** Handles /summary command */
    async handleSummary(chatId, args) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        const startDate = new Date();
        const days = args.length ? parseInt(args[0]) : defaultSummaryDays;
        startDate.setDate(startDate.getDate() - days);
        const summary = await transactionService_1.default.getTransactionsSummary({
            startDate,
        });
        // Format numbers with commas (thousands separators)
        const formatter = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
        });
        return this.createResponse(`📊 Transaction Summary:\n` +
            `${this.getTransactionTypeIcon('INCOME')} Total Income: ${formatter.format(summary.totalIncome)}\n` +
            `${this.getTransactionTypeIcon('EXPENSE')} Total Expense: ${formatter.format(summary.totalExpense)}`);
    }
    /** Handles /categories command */
    async handleCategories(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        const categories = await categoryService_1.default.list();
        if (categories.length === 0) {
            return this.createResponse('No categories found.');
        }
        const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join('\n');
        return this.createResponse(`Available Categories:\n${categoryList}`);
    }
    /** Handles /delete <transaction_id> command */
    async handleDelete(chatId, args) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        let transactionId = args[0];
        // If command comes as "/delete_<transactionId>", extract the ID
        if (!transactionId && chatId.toString().includes('_')) {
            transactionId = chatId.toString().split('_')[1];
        }
        if (!transactionId) {
            return this.createResponse('Please provide a transaction ID to delete.');
        }
        try {
            await transactionService_1.default.deleteTransaction(transactionId);
            return this.createResponse(`✅ Transaction ${transactionId} deleted successfully.`);
        }
        catch (error) {
            logger_1.default.error(`Failed to delete transaction ${transactionId}`, error);
            return this.createResponse(`❌ Failed to delete transaction ${transactionId}.`);
        }
    }
    /** Handles /reset command */
    handleReset(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return this.createResponse('State has been reset.');
    }
    /** Handles /insights command */
    async handleInsights(chatId) {
        this.bot.sendMessage(chatId, 'Sending insights...');
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
            case transactionManager_1.UserStatus.AWAITING_TYPE:
            case transactionManager_1.UserStatus.AWAITING_AMOUNT:
            case transactionManager_1.UserStatus.AWAITING_DESCRIPTION:
            case transactionManager_1.UserStatus.AWAITING_DATE:
                response = this.createResponse(message, false);
                break;
            case transactionManager_1.UserStatus.TRANSACTION_COMPLETE:
                response = this.createResponse(message, true);
                break;
            case transactionManager_1.UserStatus.FAILURE:
                response = this.createResponse('❌ Transaction failed. Please try again.', true);
                break;
        }
        logger_1.default.debug(`User state response: ${response.message}`);
        return response;
    }
    /** Handles /update <transaction_id> command */
    async handleUpdate(chatId, args) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        let transactionId = args[0];
        // Extract transactionId from "/update_<transactionId>"
        if (!transactionId && chatId.toString().includes('_')) {
            transactionId = chatId.toString().split('_')[1];
        }
        if (!transactionId) {
            return this.createResponse('Please provide a transaction ID to update.');
        }
        return this.createResponse(`You selected to update transaction ${transactionId}.\nUse the following commands to update:\n\n` +
            `/update ${transactionId} description <new_description>\n` +
            `/update ${transactionId} value <new_value>\n` +
            `/update ${transactionId} categoryId <new_category_id>\n`);
    }
    /** Handle search command */
    async handleSearch(chatId, args) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        if (args.length === 0) {
            return this.createResponse('Please provide a keyword to search for transactions.');
        }
        const searchQuery = args.join(' '); // Join arguments into a search term
        const transactions = await transactionService_1.default.getTransactions({
            searchTerm: searchQuery,
            page: 1,
            perPage: 10,
        });
        if (transactions.length === 0) {
            return this.createResponse(`No transactions found matching "${searchQuery}".`);
        }
        // Format transactions for display
        const transactionList = transactions
            .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by latest date
            .map((t) => {
            const formattedDate = new Date(t.date).toISOString().split('T')[0];
            return `\u200F${this.getTransactionTypeIcon(t.type)} ${t.description} ${t.value}
    \u200Fקטגוריה: ${t.category.name}
    \u200F${formattedDate}
    
    🗑 /delete ${t.id}
    ✏️ /update ${t.id}`;
        })
            .join('\n\n');
        return this.createResponse(`🔍 *Search results for:* "${searchQuery}"\n\n${transactionList}`);
    }
    getTransactionTypeIcon(type) {
        return type === 'EXPENSE' ? '📉' : '📈';
    }
}
exports.webhookController = new WebhookController();
