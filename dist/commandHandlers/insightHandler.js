"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightsHandler = void 0;
const telegramService_1 = require("../services/telegramService");
const aiServiceFactory_1 = __importDefault(require("../services/ai/aiServiceFactory"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
class InsightsHandler {
    constructor() {
        this.aiService = aiServiceFactory_1.default.getAIService();
    }
    async handleInsights(chatId) {
        await telegramService_1.telegramService.sendMessage(chatId, '🔄 Analyzing your expenses...');
        const transactions = await transactionService_1.default.getTransactions({
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
            transactionType: 'EXPENSE',
            page: 1,
            perPage: 100,
        });
        if (transactions.length === 0) {
            return telegramService_1.telegramService.sendMessage(chatId, '❌ No transactions found.');
        }
        const expenseSummary = transactions
            .map((t) => `${t.date.toISOString().split('T')[0]} - ${t.description}: $${t.value}`)
            .join('\n');
        const insights = await this.aiService.analyzeExpenses(expenseSummary);
        return telegramService_1.telegramService.sendMessage(chatId, `💡 *Expense Insights:*\n${insights}`);
    }
}
exports.insightsHandler = new InsightsHandler();
