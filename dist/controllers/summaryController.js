"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionNotifierFactory_1 = __importDefault(require("../services/transactionNotification/transactionNotifierFactory"));
const aiServiceFactory_1 = __importDefault(require("../services/ai/aiServiceFactory"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
class SummaryController {
    constructor() {
        this.transactionNotifier = transactionNotifierFactory_1.default.getNotifier();
        this.aiProvider = aiServiceFactory_1.default.getAIService();
    }
    async sendTodaySummary() {
        const fullSummaryMessage = await this.getSummaryMessage();
        await this.transactionNotifier.sendDailySummary(fullSummaryMessage);
    }
    async getAllTodayTransactions() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const transactionsToday = await transactionService_1.default.getAllTransactions({
            startDate: startOfToday,
            endDate: endOfToday,
        });
        return transactionsToday;
    }
    formatTransactionList(transactions) {
        return transactions
            .map((transaction) => {
            var _a;
            const description = transaction.description || '';
            const category = ((_a = transaction.category) === null || _a === void 0 ? void 0 : _a.name) || '';
            const amount = transaction.value || 0;
            return `${category}, ${description}, ${amount} ש״ח`;
        })
            .join('\n');
    }
    formatTotalAmount(totalAmount) {
        return `*סך הכל הוצאות:*\n${totalAmount} ש״ח\n`;
    }
    formatAiInsights(aiInsights) {
        return `*סיכום:*\n${aiInsights}`;
    }
    formatSummaryMessage(transactions, totalAmount, aiInsights) {
        const transactionList = this.formatTransactionList(transactions);
        const totalAmountSection = this.formatTotalAmount(totalAmount);
        const aiInsightsSection = this.formatAiInsights(aiInsights);
        return [
            '*ההוצאות של היום:*',
            transactionList,
            '',
            totalAmountSection,
            '',
            aiInsightsSection,
        ].join('\n');
    }
    async getSummaryMessage() {
        const transactions = await this.getAllTodayTransactions();
        if (transactions.length === 0) {
            return 'לא נוספו הוצאות היום.';
        }
        const transactionsTextForAiAnalyzer = transactions
            .map((t) => { var _a; return `description:${t.description}, category: ${(_a = t.category) === null || _a === void 0 ? void 0 : _a.name}, amount: ${t.value}`; })
            .join('\n');
        const aiInsights = await this.aiProvider.analyzeExpenses(transactionsTextForAiAnalyzer, 'add a funny summary based on my expenses at the end');
        const total = transactions.reduce((sum, t) => sum + t.value, 0);
        return this.formatSummaryMessage(transactions, total, aiInsights);
    }
}
exports.default = new SummaryController();
