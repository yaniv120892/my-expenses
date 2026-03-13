"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiServiceFactory_1 = __importDefault(require("./ai/aiServiceFactory"));
const dashboardRepository_1 = __importDefault(require("../repositories/dashboardRepository"));
const subscriptionDetectionService_1 = __importDefault(require("./subscriptionDetectionService"));
const logger_1 = __importDefault(require("../utils/logger"));
const redisProvider_1 = require("../common/redisProvider");
class DashboardService {
    constructor() {
        this.aiService = aiServiceFactory_1.default.getAIService();
    }
    async getDashboard(userId) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        const [currentMonthSummary, previousMonthSummary, topCategoriesCurrent, topCategoriesPrevious, recentTransactions, subscriptionSnapshot,] = await Promise.all([
            dashboardRepository_1.default.getMonthSummary(userId, currentYear, currentMonth),
            dashboardRepository_1.default.getMonthSummary(userId, prevYear, prevMonth),
            dashboardRepository_1.default.getTopCategoriesForMonth(userId, currentYear, currentMonth, 7),
            dashboardRepository_1.default.getTopCategoriesForMonth(userId, prevYear, prevMonth, 7),
            dashboardRepository_1.default.getRecentTransactions(userId, 5),
            subscriptionDetectionService_1.default.getDashboardSnapshot(userId),
        ]);
        const monthComparison = this.buildMonthComparison(currentMonthSummary, previousMonthSummary);
        const topCategories = this.mergeTopCategories(topCategoriesCurrent, topCategoriesPrevious, currentMonthSummary.totalExpense);
        return { monthComparison, topCategories, recentTransactions, subscriptions: subscriptionSnapshot };
    }
    async getInsights(userId) {
        const now = new Date();
        const cacheKey = `dashboard-insights:${userId}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        try {
            const cached = await (0, redisProvider_1.getValue)(cacheKey);
            if (cached) {
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }
        }
        catch (error) {
            logger_1.default.error('Failed to read dashboard insights cache:', error);
        }
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        try {
            const [currentMonthSummary, previousMonthSummary, topCategories] = await Promise.all([
                dashboardRepository_1.default.getMonthSummary(userId, currentYear, currentMonth),
                dashboardRepository_1.default.getMonthSummary(userId, prevYear, prevMonth),
                dashboardRepository_1.default.getTopCategoriesForMonth(userId, currentYear, currentMonth, 7),
            ]);
            const result = await this.generateAiInsights(currentMonthSummary, topCategories, previousMonthSummary);
            if (result) {
                try {
                    await (0, redisProvider_1.setValue)(cacheKey, JSON.stringify(result), 3600); // 1 hour TTL
                }
                catch (cacheError) {
                    logger_1.default.error('Failed to cache dashboard insights:', cacheError);
                }
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to generate dashboard insights:', error);
            return null;
        }
    }
    calculatePercentageChange(current, previous) {
        const amount = current - previous;
        const percentage = previous === 0 ? 0 : ((current - previous) / previous) * 100;
        let trend = 'stable';
        if (percentage > 5)
            trend = 'up';
        else if (percentage < -5)
            trend = 'down';
        return { amount, percentage, trend };
    }
    buildMonthComparison(current, previous) {
        return {
            currentMonth: current,
            previousMonth: previous,
            incomeChange: this.calculatePercentageChange(current.totalIncome, previous.totalIncome),
            expenseChange: this.calculatePercentageChange(current.totalExpense, previous.totalExpense),
            savingsChange: this.calculatePercentageChange(current.savings, previous.savings),
        };
    }
    mergeTopCategories(current, previous, totalExpense) {
        const previousMap = new Map(previous.map((c) => [c.categoryId, c.amount]));
        return current.map((cat) => {
            var _a;
            const previousMonthAmount = (_a = previousMap.get(cat.categoryId)) !== null && _a !== void 0 ? _a : 0;
            const percentage = totalExpense === 0 ? 0 : (cat.amount / totalExpense) * 100;
            const change = this.calculatePercentageChange(cat.amount, previousMonthAmount);
            return {
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                amount: cat.amount,
                percentage,
                previousMonthAmount,
                change,
            };
        });
    }
    async generateAiInsights(currentMonth, topCategories, previousMonth) {
        try {
            const categoriesSummary = topCategories
                .map((c) => `${c.categoryName}: ${c.amount.toFixed(2)}`)
                .join(', ');
            const prompt = `Analyze these monthly expenses and provide insights.
Current month (${currentMonth.month}): Income ${currentMonth.totalIncome.toFixed(2)}, Expenses ${currentMonth.totalExpense.toFixed(2)}, Savings ${currentMonth.savings.toFixed(2)}.
Previous month (${previousMonth.month}): Income ${previousMonth.totalIncome.toFixed(2)}, Expenses ${previousMonth.totalExpense.toFixed(2)}, Savings ${previousMonth.savings.toFixed(2)}.
Top spending categories this month: ${categoriesSummary}.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{"unusualSpending": ["insight 1", "insight 2"], "summary": "A brief overall summary"}`;
            const response = await this.aiService.analyzeExpenses(prompt);
            // Try to parse the JSON response
            const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return parsed;
        }
        catch (error) {
            logger_1.default.error('Failed to parse AI insights response:', error);
            return null;
        }
    }
}
exports.default = new DashboardService();
