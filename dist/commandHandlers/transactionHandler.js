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
    async handleList(chatId, args) {
        const days = args.length ? parseInt(args[0]) || 5 : 5;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const transactions = await transactionService_1.default.getTransactions({
            startDate,
            transactionType: 'EXPENSE',
            page: 1,
            perPage: 10,
        });
        if (transactions.length === 0) {
            return telegramService_1.telegramService.sendMessage(chatId, 'No transactions found.');
        }
        const transactionList = transactions
            .map((transaction) => (0, transactionUtils_1.formatTransaction)(transaction))
            .join('\n\n');
        return telegramService_1.telegramService.sendMessage(chatId, transactionList);
    }
    async handleSummary(chatId, args) {
        const days = args.length ? parseInt(args[0]) : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const summary = await transactionService_1.default.getTransactionsSummary({
            startDate,
        });
        return telegramService_1.telegramService.sendMessage(chatId, `📊 *Transaction Summary:*\n💰 Income: $${summary.totalIncome.toLocaleString()}\n💸 Expenses: $${summary.totalExpense.toLocaleString()}`);
    }
    async handleSearch(chatId, args) {
        if (args.length === 0) {
            return telegramService_1.telegramService.sendMessage(chatId, 'Please provide a search term.');
        }
        const transactions = await transactionService_1.default.getTransactions({
            searchTerm: args.join(' '),
            page: 1,
            perPage: 10,
        });
        if (transactions.length === 0) {
            return telegramService_1.telegramService.sendMessage(chatId, `No transactions found for "${args.join(' ')}".`);
        }
        const transactionList = transactions
            .map((transaction) => (0, transactionUtils_1.formatTransaction)(transaction))
            .join('\n\n');
        return telegramService_1.telegramService.sendMessage(chatId, `🔍 *Search results for:* "${args.join(' ')}"\n\n${transactionList}`);
    }
}
exports.transactionHandler = new TransactionHandler();
