"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramTransactionNotifier = void 0;
const telegramService_1 = require("../telegramService");
const transactionUtils_1 = require("../../utils/transactionUtils");
const logger_1 = __importDefault(require("../../utils/logger"));
const userSettingsService_1 = __importDefault(require("../userSettingsService"));
class TelegramTransactionNotifier {
    async notifyTransactionCreated(transaction, userId) {
        try {
            logger_1.default.debug('Start sending transaction notification to Telegram', userId, transaction.id);
            const chatId = await this.getChatId(userId);
            if (!chatId) {
                logger_1.default.warn('skipping transaction notification. Telegram chat ID is not set or user has disabled notifications', userId, transaction.id);
                return;
            }
            const message = `Transaction Created\n${(0, transactionUtils_1.formatTransaction)(transaction)}`;
            await telegramService_1.telegramService.sendMessage(Number(chatId), message);
            logger_1.default.debug('Done sending transaction notification to Telegram', userId, transaction.id);
        }
        catch (error) {
            logger_1.default.error('Failed to send transaction notification', userId, transaction.id);
            throw new Error(`Failed to send transaction notification, userId: ${userId} transactionId: ${transaction.id} error: ${JSON.stringify(error)}`);
        }
    }
    async sendDailySummary(dailySummary, userId) {
        try {
            logger_1.default.debug('Start sending daily summary to Telegram', userId);
            const chatId = await this.getChatId(userId);
            if (!chatId) {
                logger_1.default.warn('Skip sending daily summary, Telegram chat ID is not set or user has disabled notifications', userId);
                return;
            }
            await telegramService_1.telegramService.sendMessage(Number(chatId), dailySummary);
            logger_1.default.debug('Done sending daily summary to Telegram', userId);
        }
        catch (error) {
            logger_1.default.error('Failed to send daily summary', userId, error);
            throw new Error(`Failed to send daily summary, userId: ${userId} error: ${JSON.stringify(error)}`);
        }
    }
    async getChatId(userId) {
        var _a;
        const userChatId = await userSettingsService_1.default.getUserSettings(userId);
        return ((_a = userChatId === null || userChatId === void 0 ? void 0 : userChatId.provider) === null || _a === void 0 ? void 0 : _a.enabled)
            ? userChatId.provider.telegramChatId
            : null;
    }
}
exports.TelegramTransactionNotifier = TelegramTransactionNotifier;
