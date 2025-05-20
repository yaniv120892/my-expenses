"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionHandler = void 0;
const transactionManager_1 = require("../services/transactionManager");
const transactionService_1 = __importDefault(require("../services/transactionService"));
const telegramService_1 = require("../services/telegramService");
const transactionUtils_1 = require("../utils/transactionUtils");
class TransactionHandler {
    async handleCreate(chatId) {
        const { message } = await transactionManager_1.transactionManager.handleUserState(chatId, '/create');
        return telegramService_1.telegramService.sendMessage(chatId, message);
    }
    async handleList(chatId, userId, days) {
        if (!userId) {
            return telegramService_1.telegramService.sendMessage(chatId, 'Please provide a user ID');
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days || 5));
        const transactions = await transactionService_1.default.getTransactions({
            startDate,
            transactionType: 'EXPENSE',
            page: 1,
            perPage: 10,
            userId: userId,
        });
        if (transactions.length === 0) {
            return telegramService_1.telegramService.sendMessage(chatId, 'No transactions found.');
        }
        const transactionList = transactions
            .map((transaction) => (0, transactionUtils_1.formatTransaction)(transaction))
            .join('\n\n');
        await telegramService_1.telegramService.sendMessage(chatId, transactionList);
    }
    async handleSummary(chatId, userId, days) {
        if (!userId) {
            return telegramService_1.telegramService.sendMessage(chatId, 'Please provide a user ID');
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days || 30));
        const summary = await transactionService_1.default.getTransactionsSummary({
            startDate,
            userId,
        });
        await telegramService_1.telegramService.sendMessage(chatId, `📊 *Transaction Summary:*\n💰 Income: $${summary.totalIncome.toLocaleString()}\n💸 Expenses: $${summary.totalExpense.toLocaleString()}`);
    }
    async handleSearch(chatId, userId, searchTerm) {
        if (!searchTerm) {
            return telegramService_1.telegramService.sendMessage(chatId, 'Please provide a search term.');
        }
        if (!userId) {
            return telegramService_1.telegramService.sendMessage(chatId, 'Please provide a user ID');
        }
        const transactions = await transactionService_1.default.getTransactions({
            searchTerm: searchTerm,
            page: 1,
            perPage: 10,
            userId,
        });
        if (transactions.length === 0) {
            return telegramService_1.telegramService.sendMessage(chatId, `No transactions found for "${searchTerm}".`);
        }
        const transactionList = transactions
            .map((transaction) => (0, transactionUtils_1.formatTransaction)(transaction))
            .join('\n\n');
        await telegramService_1.telegramService.sendMessage(chatId, `🔍 *Search results for:* "${searchTerm}"\n\n${transactionList}`);
    }
}
exports.transactionHandler = new TransactionHandler();
