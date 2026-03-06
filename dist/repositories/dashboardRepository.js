"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const categoryHierarchy_1 = require("../utils/categoryHierarchy");
const categoryRepository_1 = __importDefault(require("./categoryRepository"));
class DashboardRepository {
    async getMonthSummary(userId, year, month) {
        var _a, _b, _c, _d;
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        const groups = await client_1.default.transaction.groupBy({
            by: ['type'],
            _sum: { value: true },
            where: {
                userId,
                status: client_2.TransactionStatus.APPROVED,
                date: { gte: startOfMonth, lte: endOfMonth },
            },
        });
        const incomeGroup = groups.find((g) => g.type === client_2.TransactionType.INCOME);
        const expenseGroup = groups.find((g) => g.type === client_2.TransactionType.EXPENSE);
        const totalIncome = (_b = (_a = incomeGroup === null || incomeGroup === void 0 ? void 0 : incomeGroup._sum) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
        const totalExpense = (_d = (_c = expenseGroup === null || expenseGroup === void 0 ? void 0 : expenseGroup._sum) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0;
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        return {
            month: monthStr,
            totalIncome,
            totalExpense,
            savings: totalIncome - totalExpense,
        };
    }
    async getTopCategoriesForMonth(userId, year, month, limit = 7) {
        var _a, _b, _c, _d;
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        const groups = await client_1.default.transaction.groupBy({
            by: ['categoryId'],
            _sum: { value: true },
            where: {
                userId,
                status: client_2.TransactionStatus.APPROVED,
                type: client_2.TransactionType.EXPENSE,
                date: { gte: startOfMonth, lte: endOfMonth },
            },
            orderBy: { _sum: { value: 'desc' } },
        });
        // Build parent map and aggregate at parent level
        const parentMap = await (0, categoryHierarchy_1.buildCategoryParentMap)();
        const topLevelCategories = await categoryRepository_1.default.getTopLevelCategories();
        const topLevelIds = new Set(topLevelCategories.map((c) => c.id));
        const parentAggregation = new Map();
        for (const group of groups) {
            if (!group.categoryId)
                continue;
            const parentId = (_a = parentMap.get(group.categoryId)) !== null && _a !== void 0 ? _a : group.categoryId;
            const current = (_b = parentAggregation.get(parentId)) !== null && _b !== void 0 ? _b : 0;
            parentAggregation.set(parentId, current + ((_d = (_c = group._sum) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0));
        }
        // Sort by amount desc and take top N
        const sorted = Array.from(parentAggregation.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
        const categoryIds = sorted.map(([id]) => id);
        // Resolve category names
        const categories = await client_1.default.category.findMany({
            where: { id: { in: categoryIds } },
        });
        const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
        return sorted.map(([categoryId, amount]) => {
            var _a;
            return ({
                categoryId,
                categoryName: (_a = categoryNameMap.get(categoryId)) !== null && _a !== void 0 ? _a : 'Unknown',
                amount,
            });
        });
    }
    async getRecentTransactions(userId, limit = 5) {
        const transactions = await client_1.default.transaction.findMany({
            where: { userId, status: client_2.TransactionStatus.APPROVED },
            orderBy: { date: 'desc' },
            take: limit,
            include: { category: { select: { name: true } } },
        });
        return transactions.map((t) => {
            var _a, _b, _c;
            return ({
                id: t.id,
                description: (_a = t.description) !== null && _a !== void 0 ? _a : '',
                value: t.value,
                date: t.date.toISOString(),
                type: t.type,
                categoryName: (_c = (_b = t.category) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'Uncategorized',
            });
        });
    }
}
exports.default = new DashboardRepository();
