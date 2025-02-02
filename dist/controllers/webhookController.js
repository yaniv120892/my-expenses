"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = void 0;
const transactionManager_1 = require("../services/transactionManager"); // Use the new unified service
const logger_1 = __importDefault(require("../utils/logger"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
class WebhookController {
    async handleWebhook(req) {
        const chatId = req.message.chat.id;
        const text = req.message.text;
        const sanitizedText = text === null || text === void 0 ? void 0 : text.toLowerCase().trim();
        try {
            switch (sanitizedText) {
                case undefined:
                case null:
                case '':
                    return { message: 'Please enter a valid command.' };
                case '/start':
                    return {
                        message: `Welcome to the transaction bot.
              1. /create - create a transaction.
              2. /list to list transactions.
              3. /reset to reset the state.`,
                    };
                case '/create':
                    transactionManager_1.transactionManager.resetUserState(chatId);
                    return transactionManager_1.transactionManager.handleUserState(chatId, sanitizedText);
                case '/list':
                    const startDate = new Date().getDate() - 10;
                    const transactions = await transactionService_1.default.getTransactions({
                        startDate: new Date(startDate),
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
                        .join('\n\n'); // Join transactions with a double newline for separation
                    return {
                        message: transactionString || 'No transactions found.',
                    };
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
