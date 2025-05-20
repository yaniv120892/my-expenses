"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const aiServiceFactory_1 = __importDefault(require("./ai/aiServiceFactory"));
class SummaryService {
    constructor() {
        this.aiService = aiServiceFactory_1.default.getAIService();
    }
    async getTodaySummary(userId) {
        const transactions = await this.getTodayTransactions(userId);
        const summary = this.buildSummary(transactions);
        const aiSummary = await this.getFunnyAiSummary(transactions);
        return { summary, aiSummary };
    }
    getTodayDateRange() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }
    async getTodayTransactions(userId) {
        const { start, end } = this.getTodayDateRange();
        return transactionRepository_1.default.getTransactions({
            startDate: start,
            endDate: end,
            page: 1,
            perPage: 100,
            status: 'APPROVED',
            userId,
        });
    }
    buildSummary(transactions) {
        const total = transactions.reduce((sum, t) => sum + t.value, 0);
        return `Today's expenses: ${total.toFixed(2)} NIS (${transactions.length} transactions)`;
    }
    async getFunnyAiSummary(transactions) {
        const descriptions = transactions
            .map((t) => { var _a; return `${t.description} (${(_a = t.category) === null || _a === void 0 ? void 0 : _a.name})`; })
            .join(', ');
        const prompt = `Write a short and funny summary about these expenses: ${descriptions}`;
        return this.aiService.analyzeExpenses(prompt);
    }
}
exports.default = new SummaryService();
