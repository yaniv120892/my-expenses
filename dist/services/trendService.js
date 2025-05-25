"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const logger_1 = __importDefault(require("../utils/logger"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
const client_1 = require("@prisma/client");
class TrendService {
    async getSpendingTrends(request, userId) {
        try {
            const endDate = request.endDate || new Date();
            const startDate = request.startDate || (0, date_fns_1.subMonths)(endDate, 6);
            const currentPeriodData = await transactionRepository_1.default.getTransactions({
                startDate,
                endDate,
                categoryId: request.categoryId,
                userId,
                status: client_1.TransactionStatus.APPROVED,
                page: 1,
                perPage: 1000,
                transactionType: request.transactionType || client_1.TransactionType.EXPENSE,
            });
            const previousPeriodLength = endDate.getTime() - startDate.getTime();
            const previousPeriodStartDate = new Date(startDate.getTime() - previousPeriodLength);
            const previousPeriodData = await transactionRepository_1.default.getTransactions({
                startDate: previousPeriodStartDate,
                endDate: startDate,
                categoryId: request.categoryId,
                userId,
                status: client_1.TransactionStatus.APPROVED,
                page: 1,
                perPage: 1000,
                transactionType: request.transactionType || client_1.TransactionType.EXPENSE,
            });
            const points = this.groupTransactionsByPeriod(currentPeriodData, request.period);
            const totalAmount = points.reduce((sum, point) => sum + point.amount, 0);
            const previousTotalAmount = previousPeriodData.reduce((sum, transaction) => sum + transaction.value, 0);
            return {
                period: request.period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                points,
                totalAmount,
                percentageChange: this.calculatePercentageChange(totalAmount, previousTotalAmount),
                trend: this.calculateTrend(totalAmount, previousTotalAmount),
            };
        }
        catch (error) {
            logger_1.default.error('Error in getSpendingTrends:', error);
            throw error;
        }
    }
    async getCategorySpendingTrends(request, userId) {
        try {
            const { startDate, endDate } = this.getDateRange(request);
            // Fetch all data in parallel
            const [currentPeriodData, previousPeriodData, topLevelCategories, categoryParentMap,] = await Promise.all([
                this.fetchTransactionsForPeriod(startDate, endDate, userId, request.transactionType),
                this.fetchPreviousPeriodData(startDate, endDate, userId, request.transactionType),
                categoryRepository_1.default.getTopLevelCategories(),
                this.buildCategoryParentMap(),
            ]);
            // Initialize category trends with top-level categories
            const categoryTrends = new Map();
            topLevelCategories.forEach((cat) => {
                categoryTrends.set(cat.id, {
                    points: [],
                    totalAmount: 0,
                    categoryName: cat.name,
                    childCategories: new Set(),
                });
            });
            // Process current period transactions
            for (const transaction of currentPeriodData) {
                if (!transaction.category) {
                    logger_1.default.warn(`Transaction ${transaction.id} has no category`);
                    continue;
                }
                const topLevelCategoryId = categoryParentMap.get(transaction.category.id);
                if (!topLevelCategoryId) {
                    logger_1.default.warn(`Top level category not found for transaction ${transaction.id}`);
                    continue;
                }
                const existing = categoryTrends.get(topLevelCategoryId);
                if (!existing) {
                    continue;
                }
                existing.totalAmount += transaction.value;
                existing.childCategories.add(transaction.category.id);
            }
            // Calculate trends for each category that has transactions
            const results = [];
            for (const [categoryId, data] of categoryTrends.entries()) {
                // Skip categories with no transactions
                if (data.childCategories.size === 0) {
                    continue;
                }
                const categoryTransactions = this.filterTransactionsByCategory(currentPeriodData, data.childCategories);
                const points = this.groupTransactionsByPeriod(categoryTransactions, request.period).map((point) => (Object.assign(Object.assign({}, point), { categoryId, categoryName: data.categoryName })));
                const previousCategoryTransactions = this.filterTransactionsByCategory(previousPeriodData, data.childCategories);
                const previousTotalAmount = this.calculateTotalAmount(previousCategoryTransactions);
                results.push(this.createCategoryTrend(request, startDate, endDate, points, data, previousTotalAmount, categoryId));
            }
            return results.sort((a, b) => b.totalAmount - a.totalAmount);
        }
        catch (error) {
            logger_1.default.error('Error in getCategorySpendingTrends:', error);
            throw error;
        }
    }
    getDateRange(request) {
        const endDate = request.endDate || new Date();
        const startDate = request.startDate || (0, date_fns_1.subMonths)(endDate, 6);
        return { startDate, endDate };
    }
    async fetchTransactionsForPeriod(startDate, endDate, userId, transactionType) {
        return transactionRepository_1.default.getTransactions({
            startDate,
            endDate,
            userId,
            status: client_1.TransactionStatus.APPROVED,
            page: 1,
            perPage: 1000,
            transactionType: transactionType || client_1.TransactionType.EXPENSE,
        });
    }
    async fetchPreviousPeriodData(startDate, endDate, userId, transactionType) {
        const previousPeriodLength = endDate.getTime() - startDate.getTime();
        const previousPeriodStartDate = new Date(startDate.getTime() - previousPeriodLength);
        return this.fetchTransactionsForPeriod(previousPeriodStartDate, startDate, userId, transactionType);
    }
    filterTransactionsByCategory(transactions, categoryIds) {
        return transactions.filter((t) => t.category && categoryIds.has(t.category.id));
    }
    calculateTotalAmount(transactions) {
        return transactions.reduce((sum, transaction) => sum + transaction.value, 0);
    }
    createCategoryTrend(request, startDate, endDate, points, data, previousTotalAmount, categoryId) {
        return {
            period: request.period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            points,
            totalAmount: data.totalAmount,
            percentageChange: this.calculatePercentageChange(data.totalAmount, previousTotalAmount),
            trend: this.calculateTrend(data.totalAmount, previousTotalAmount),
            categoryId,
            categoryName: data.categoryName,
        };
    }
    calculateTrend(currentAmount, previousAmount) {
        if (previousAmount === 0)
            return 'stable';
        const percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
        if (percentageChange > 5)
            return 'up';
        if (percentageChange < -5)
            return 'down';
        return 'stable';
    }
    calculatePercentageChange(currentAmount, previousAmount) {
        if (previousAmount === 0)
            return 0;
        return ((currentAmount - previousAmount) / previousAmount) * 100;
    }
    groupTransactionsByPeriod(transactions, period) {
        const groupedData = new Map();
        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            let key;
            switch (period) {
                case 'daily':
                    key = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
                    break;
                case 'weekly':
                    key = (0, date_fns_1.format)(date, 'yyyy-ww'); // ISO week number
                    break;
                case 'monthly':
                    key = (0, date_fns_1.format)(date, 'yyyy-MM');
                    break;
                case 'yearly':
                    key = (0, date_fns_1.format)(date, 'yyyy');
                    break;
                default:
                    key = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
            }
            const existing = groupedData.get(key) || { amount: 0, count: 0 };
            groupedData.set(key, {
                amount: existing.amount + transaction.value,
                count: existing.count + 1,
            });
        });
        return Array.from(groupedData.entries()).map(([date, data]) => ({
            date,
            amount: data.amount,
            count: data.count,
        }));
    }
    async buildCategoryParentMap() {
        const allCategories = await categoryRepository_1.default.getAllCategories();
        const parentMap = new Map();
        // First pass: Create a map of category ID to its parent ID
        const categoryToParentMap = new Map();
        for (const category of allCategories) {
            if ('parentId' in category && category.parentId !== null) {
                categoryToParentMap.set(category.id, category.parentId);
            }
        }
        // Second pass: For each category, traverse up to find top-level parent
        for (const category of allCategories) {
            let currentId = category.id;
            let parentId = categoryToParentMap.get(currentId);
            // If we've already processed this category, skip it
            if (parentMap.has(currentId))
                continue;
            // Keep going up the chain until we find a category with no parent
            while (parentId) {
                const nextParentId = categoryToParentMap.get(parentId);
                if (!nextParentId) {
                    // We found the top-level parent
                    parentMap.set(currentId, parentId);
                    break;
                }
                currentId = parentId;
                parentId = nextParentId;
            }
            // If we didn't find a parent, this category is itself a top-level category
            if (!parentMap.has(category.id)) {
                parentMap.set(category.id, category.id);
            }
        }
        return parentMap;
    }
}
exports.default = new TrendService();
