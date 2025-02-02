"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
class TelegramService {
    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
        this.bot = new node_telegram_bot_api_1.default(token);
    }
    async sendMessage(chatId, message) {
        return this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    async editMessage(chatId, messageId, newText) {
        return this.bot.editMessageText(newText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
        });
    }
}
exports.telegramService = new TelegramService();
