"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramTransactionCreatedNotifier = void 0;
const telegramService_1 = require("../telegramService");
const transactionUtils_1 = require("../../utils/transactionUtils");
const logger_1 = __importDefault(require("../../utils/logger"));
class TelegramTransactionCreatedNotifier {
    async notifyTransactionCreated(transaction) {
        const chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
        if (!chatId) {
            logger_1.default.warn('Telegram chat ID is not set. Skipping notification.');
            return;
        }
        const message = `Transaction Created\n${(0, transactionUtils_1.formatTransaction)(transaction)}`;
        await telegramService_1.telegramService.sendMessage(Number(chatId), message);
    }
}
exports.TelegramTransactionCreatedNotifier = TelegramTransactionCreatedNotifier;
