"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandHandler = void 0;
const userHandler_1 = require("./userHandler");
const transactionHandler_1 = require("./transactionHandler");
const insightHandler_1 = require("./insightHandler");
class CommandHandler {
    async executeCommand(command, chatId, args) {
        switch (command) {
            case '/start':
                return userHandler_1.userHandler.handleStart(chatId);
            case '/help':
                return userHandler_1.userHandler.handleHelp(chatId);
            case '/reset':
                await userHandler_1.userHandler.handleReset(chatId);
                return userHandler_1.userHandler.handleHelp(chatId);
            case '/list':
                return transactionHandler_1.transactionHandler.handleList(chatId, args);
            case '/create':
                return transactionHandler_1.transactionHandler.handleCreate(chatId);
            case '/summary':
                return transactionHandler_1.transactionHandler.handleSummary(chatId, args);
            case '/search':
                return transactionHandler_1.transactionHandler.handleSearch(chatId, args);
            case '/insights':
                return insightHandler_1.insightsHandler.handleInsights(chatId);
            default:
                return userHandler_1.userHandler.handleUserState(chatId, command);
        }
    }
}
exports.commandHandler = new CommandHandler();
