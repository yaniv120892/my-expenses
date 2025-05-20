"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandHandler = void 0;
const userHandler_1 = require("./userHandler");
const transactionHandler_1 = require("./transactionHandler");
const insightHandler_1 = require("./insightHandler");
const categoryHandler_1 = require("./categoryHandler");
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
                await transactionHandler_1.transactionHandler.handleList(chatId, this.extractUserIdFromCommand(args));
                return userHandler_1.userHandler.handleHelp(chatId);
            case '/create':
                return transactionHandler_1.transactionHandler.handleCreate(chatId);
            case '/summary':
                await transactionHandler_1.transactionHandler.handleSummary(chatId, this.extractUserIdFromCommand(args));
                return userHandler_1.userHandler.handleHelp(chatId);
            case '/search':
                await transactionHandler_1.transactionHandler.handleSearch(chatId, this.extractUserIdFromCommand(args), args.slice(2).join(' '));
                return userHandler_1.userHandler.handleHelp(chatId);
            case '/insights':
                await insightHandler_1.insightsHandler.handleInsights(chatId, this.extractUserIdFromCommand(args));
            case '/categories':
                await categoryHandler_1.categoryHandler.handleList(chatId);
                return userHandler_1.userHandler.handleHelp(chatId);
            default:
                return userHandler_1.userHandler.handleUserState(chatId, command);
        }
    }
    extractUserIdFromCommand(args) {
        if (args.length <= 1) {
            return null;
        }
        return args[1];
    }
}
exports.commandHandler = new CommandHandler();
