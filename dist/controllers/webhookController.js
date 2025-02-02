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
class WebhookController {
    async handleWebhook(req) {
        const chatId = req.message.chat.id;
        const text = req.message.text;
        const sanitizedText = text === null || text === void 0 ? void 0 : text.toLowerCase().trim();
        try {
            if (!sanitizedText) {
                return { message: 'Please enter a valid command.' };
            }
            const [command, ...args] = sanitizedText.split(' ');
            switch (command) {
                case '/start':
                    return {
                        message: `Welcome to the transaction bot.
1. /create - Create a new transaction.
2. /list <days> - List transactions from the last <days> days (default: 10 days).
3. /summary - Get a summary of your income and expenses.
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
6. /reset - Reset the state.
7. /help - Show available commands.`,
                    };
                case '/help':
                    return {
                        message: `Available commands:
1. /create - Create a transaction.
2. /list <days> - List transactions from the last <days> days (default: 10).
3. /summary - Get a summary of your transactions.
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
6. /reset - Reset user state.`,
                    };
                case '/create':
                    transactionManager_1.transactionManager.resetUserState(chatId);
                    return transactionManager_1.transactionManager.handleUserState(chatId, sanitizedText);
                case '/list': {
                    const days = args.length ? parseInt(args[0]) || 10 : 10;
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - days);
                    const transactions = await transactionService_1.default.getTransactions({
                        startDate,
                        transactionType: 'EXPENSE',
                        page: 1,
                        perPage: 10,
                    });
                    const transactionString = transactions
                        .map((transaction) => {
                        const formattedDate = new Date(transaction.date)
                            .toISOString()
                            .split('T')[0];
                        return `*Description*: ${transaction.description}
*Value*: ${transaction.value} 
*Date*: ${formattedDate}
*Type*: ${transaction.type}
*Category*: ${transaction.category.name}`;
                    })
                        .join('\n\n');
                    return { message: transactionString || 'No transactions found.' };
                }
                case '/summary': {
                    const summary = await transactionService_1.default.getTransactionsSummary({});
                    return {
                        message: `Transaction Summary:
*Total Income*: ${summary.totalIncome}
*Total Expense*: ${summary.totalExpense}`,
                    };
                }
                case '/categories': {
                    const categories = await categoryService_1.default.list();
                    const categoryList = categories
                        .map((c) => `*${c.id}*: ${c.name}`)
                        .join('\n');
                    return { message: `Available Categories:\n${categoryList}` };
                }
                case '/delete': {
                    if (!args.length) {
                        return { message: 'Please provide a transaction ID to delete.' };
                    }
                    const transactionId = args[0];
                    try {
                        await transactionService_1.default.deleteTransaction(transactionId);
                        return {
                            message: `Transaction ${transactionId} deleted successfully.`,
                        };
                    }
                    catch (error) {
                        return {
                            message: `Failed to delete transaction: ${JSON.stringify(error)}`,
                        };
                    }
                }
                case '/reset':
                    transactionManager_1.transactionManager.resetUserState(chatId);
                    return { message: 'State has been reset.' };
                default:
                    const textWithoutCommand = sanitizedText.replace('/', '');
                    return await transactionManager_1.transactionManager.handleUserState(chatId, textWithoutCommand);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to handle webhook:', error);
            throw error;
        }
    }
}
exports.webhookController = new WebhookController();
