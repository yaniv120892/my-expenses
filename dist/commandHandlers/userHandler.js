"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHandler = exports.UserHandler = void 0;
const telegramService_1 = require("../services/telegramService");
const transactionManager_1 = require("../services/transactionManager");
class UserHandler {
    constructor() { }
    async handleStart(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return telegramService_1.telegramService.sendMessage(chatId, '🎉 Welcome to the transaction bot!\nUse /help for available commands.');
    }
    async handleHelp(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return telegramService_1.telegramService.sendMessage(chatId, `📜 *Available Commands:*
      1. /create
      2. /list <userId> <days>
      3. /summary <userId> <days>
      4. /categories
      5. /search <userId> <keyword>
      6. /insights <userId>`);
    }
    async handleReset(chatId) {
        transactionManager_1.transactionManager.resetUserState(chatId);
        return telegramService_1.telegramService.sendMessage(chatId, '🔄 State has been reset.');
    }
    async handleUserState(chatId, text) {
        const { message, nextStep } = await transactionManager_1.transactionManager.handleUserState(chatId, text);
        return telegramService_1.telegramService.sendMessage(chatId, message);
    }
}
exports.UserHandler = UserHandler;
exports.userHandler = new UserHandler();
