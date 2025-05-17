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
        const transactions = [];
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        let hasMoreTransactions = true;
        let page = 1;
        const perPage = 100;
        while (hasMoreTransactions) {
            const transactionsPage = await transactionService_1.default.getTransactions({
                startDate: start,
                endDate: end,
                page,
                perPage,
                transactionType: 'EXPENSE',
                status: 'APPROVED',
            });
            transactions.push(...transactionsPage);
            if (transactionsPage.length < perPage) {
                hasMoreTransactions = false;
            }
            page++;
        }
        return transactions;
    }
    async getSummaryMessage() {
        const transactions = await this.getAllTodayTransactions();
        if (transactions.length === 0) {
            return 'No transactions added today.';
        }
        const transactionsText = transactions
            .map((t) => { var _a; return `description:${t.description}, category: ${(_a = t.category) === null || _a === void 0 ? void 0 : _a.name}, amount: ${t.value}`; })
            .join('\n');
        const aiInsights = await this.aiProvider.analyzeExpenses(transactionsText, 'add a funny summary based on my expenses at the end');
        const fullSummaryMessage = `*Today's expenses:*\n${transactionsText}\n\n*AI Insights:*\n${aiInsights}`;
        return fullSummaryMessage;
    }
}
exports.default = new SummaryController();
