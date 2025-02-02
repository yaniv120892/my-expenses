"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = void 0;
const commandHandler_1 = require("../commandHandlers/commandHandler");
const telegramService_1 = require("../services/telegramService");
class WebhookController {
    async handleWebhook(req) {
        var _a;
        const chatId = req.message.chat.id;
        const text = (_a = req.message.text) === null || _a === void 0 ? void 0 : _a.trim();
        if (!text) {
            return telegramService_1.telegramService.sendMessage(chatId, 'Please enter a valid command.');
        }
        const [command, ...args] = text.split(' ');
        try {
            await commandHandler_1.commandHandler.executeCommand(command, chatId, args);
        }
        catch (error) {
            console.error('Webhook Error:', error);
            return telegramService_1.telegramService.sendMessage(chatId, '❌ An error occurred.');
        }
    }
}
exports.webhookController = new WebhookController();
