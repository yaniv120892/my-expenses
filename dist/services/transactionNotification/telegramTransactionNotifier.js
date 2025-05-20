"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramTransactionNotifier = void 0;
const telegramService_1 = require("../telegramService");
const transactionUtils_1 = require("../../utils/transactionUtils");
const logger_1 = __importDefault(require("../../utils/logger"));
class TelegramTransactionNotifier {
    async notifyTransactionCreated(transaction) {
        try {
            logger_1.default.debug('Start sending transaction notification to Telegram for transaction:', JSON.stringify(transaction));
            const chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
            if (!chatId) {
                logger_1.default.warn('skipping transaction notification. Telegram chat ID is not set.');
                return;
            }
            const message = `Transaction Created\n${(0, transactionUtils_1.formatTransaction)(transaction)}`;
            await telegramService_1.telegramService.sendMessage(Number(chatId), message);
            logger_1.default.debug(`Done sending transaction notification to Telegram, message: ${message}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to send transaction notification: ${JSON.stringify(transaction)}, error: ${JSON.stringify(error)}`);
            throw new Error(`Failed to send transaction notification, ${JSON.stringify(transaction)}, error: ${JSON.stringify(error)}`);
        }
    }
    async sendDailySummary(dailySummary, userId) {
        try {
            logger_1.default.debug('Start sending daily summary to Telegram, message:', dailySummary);
            const chatId = this.getChatId(userId);
            if (!chatId) {
                logger_1.default.warn('Telegram chat ID is not set. Skipping daily summary.');
                return;
            }
            await telegramService_1.telegramService.sendMessage(Number(chatId), dailySummary);
            logger_1.default.debug(`Done sending daily summary to Telegram, message: ${dailySummary}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to send daily summary: ${dailySummary}, error: ${JSON.stringify(error)}`);
            throw new Error(`Failed to send daily summary, ${dailySummary}, error: ${JSON.stringify(error)}`);
        }
    }
    getChatId(userId) {
        // TODO: Implement logic to get chat ID from user ID
        const chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
        if (!chatId) {
            throw new Error('Telegram chat ID is not set');
        }
        return chatId;
    }
}
exports.TelegramTransactionNotifier = TelegramTransactionNotifier;
