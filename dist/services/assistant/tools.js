"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistantTools = exports.getSpendingTrends = exports.comparePeriods = exports.summarizeTransactions = exports.listTransactions = exports.listCategories = exports.USER_ID_CONTEXT_KEY = void 0;
const tools_1 = require("@mastra/core/tools");
// Deliberately zod/v4 rather than the bare `zod` import. Zod 3.25 ships both
// APIs, and the root export is v3 — which routes Mastra through its zod-v3
// adapter. That adapter's CommonJS build calls `zodToJsonSchema.default(...)`
// after an interop wrapper that leaves `default` as the module namespace, so
// every tool conversion throws "zod_to_json_schema.default is not a function"
// and no chat request can succeed. The v4 adapter uses zod's own
// `toJSONSchema` and has no such dependency.
const v4_1 = require("zod/v4");
const transactionRepository_1 = __importDefault(require("../../repositories/transactionRepository"));
const categoryRepository_1 = __importDefault(require("../../repositories/categoryRepository"));
const trendService_1 = __importDefault(require("../trendService"));
const chatAggregationService_1 = __importDefault(require("../chatAggregationService"));
exports.USER_ID_CONTEXT_KEY = 'userId';
/**
 * Transactions are fetched per query rather than paged; this bounds a single
 * tool call so a broad date range cannot pull an unbounded result set.
 */
const MAX_TRANSACTIONS = 5000;
/**
 * The user id is never part of a tool's inputSchema — it is injected server-side
 * through the request context. If the model could supply it, a prompt-injected
 * message could ask for another user's transactions.
 */
function requireUserId(context) {
    var _a;
    const userId = (_a = context.requestContext) === null || _a === void 0 ? void 0 : _a.get(exports.USER_ID_CONTEXT_KEY);
    if (typeof userId !== 'string' || !userId) {
        throw new Error('Assistant tool called without an authenticated user');
    }
    return userId;
}
const dateFilterSchema = {
    startDate: v4_1.z
        .string()
        .optional()
        .describe('Inclusive start date in YYYY-MM-DD format'),
    endDate: v4_1.z
        .string()
        .optional()
        .describe('Inclusive end date in YYYY-MM-DD format'),
    categoryName: v4_1.z
        .string()
        .optional()
        .describe('Category name, as returned by listCategories'),
    transactionType: v4_1.z
        .enum(['INCOME', 'EXPENSE'])
        .optional()
        .describe('Restrict to income or expenses'),
    searchTerm: v4_1.z
        .string()
        .optional()
        .describe('Free-text term matched against the transaction description'),
};
/**
 * Resolves a category name to an id, exact match first then partial. Carried
 * over from the previous chatService implementation.
 */
async function resolveCategoryId(categoryName) {
    if (!categoryName)
        return undefined;
    const categories = await categoryRepository_1.default.getAllCategories();
    const lowerName = categoryName.toLowerCase();
    const exact = categories.find((c) => c.name.toLowerCase() === lowerName);
    if (exact)
        return exact.id;
    const partial = categories.find((c) => c.name.toLowerCase().includes(lowerName));
    return partial === null || partial === void 0 ? void 0 : partial.id;
}
async function fetchTransactions(userId, filters) {
    const categoryId = await resolveCategoryId(filters.categoryName);
    return transactionRepository_1.default.getTransactions(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ userId, page: 1, perPage: MAX_TRANSACTIONS }, (filters.startDate ? { startDate: new Date(filters.startDate) } : {})), (filters.endDate ? { endDate: new Date(filters.endDate) } : {})), (filters.transactionType
        ? { transactionType: filters.transactionType }
        : {})), (filters.searchTerm ? { searchTerm: filters.searchTerm } : {})), (categoryId ? { categoryId } : {})));
}
exports.listCategories = (0, tools_1.createTool)({
    id: 'listCategories',
    description: 'Lists every category available to the user. Call this before filtering by category so you use a real category name rather than guessing one.',
    inputSchema: v4_1.z.object({}),
    outputSchema: v4_1.z.object({
        categories: v4_1.z.array(v4_1.z.string()),
    }),
    execute: async (_input, context) => {
        requireUserId(context);
        const categories = await categoryRepository_1.default.getAllCategories();
        return { categories: categories.map((category) => category.name) };
    },
});
exports.listTransactions = (0, tools_1.createTool)({
    id: 'listTransactions',
    description: 'Lists individual transactions matching the given filters. Use this when the user wants to see specific transactions rather than a total.',
    inputSchema: v4_1.z.object(dateFilterSchema),
    outputSchema: v4_1.z.object({
        summary: v4_1.z.string(),
        transactionCount: v4_1.z.number(),
    }),
    execute: async (input, context) => {
        const userId = requireUserId(context);
        const transactions = await fetchTransactions(userId, input);
        const result = chatAggregationService_1.default.aggregate(transactions, 'list');
        return {
            summary: result.summary,
            transactionCount: result.transactionCount,
        };
    },
});
exports.summarizeTransactions = (0, tools_1.createTool)({
    id: 'summarizeTransactions',
    description: 'Computes a figure over the transactions matching the filters — a total, average, count, category breakdown, monthly breakdown, or highest/lowest. All arithmetic is done server-side; use the returned numbers exactly as given.',
    inputSchema: v4_1.z.object(Object.assign(Object.assign({}, dateFilterSchema), { aggregation: v4_1.z
            .enum([
            'total',
            'average',
            'count',
            'breakdown_by_category',
            'breakdown_by_month',
            'min_max',
        ])
            .describe('Which figure to compute') })),
    outputSchema: v4_1.z.object({
        summary: v4_1.z.string(),
        transactionCount: v4_1.z.number(),
    }),
    execute: async (input, context) => {
        const userId = requireUserId(context);
        const transactions = await fetchTransactions(userId, input);
        const result = chatAggregationService_1.default.aggregate(transactions, input.aggregation);
        return {
            summary: result.summary,
            transactionCount: result.transactionCount,
        };
    },
});
exports.comparePeriods = (0, tools_1.createTool)({
    id: 'comparePeriods',
    description: 'Compares two date ranges and returns both totals along with the difference and percentage change, all computed server-side. Always use this for comparisons instead of calling summarizeTransactions twice and subtracting the results yourself.',
    inputSchema: v4_1.z.object({
        periodA: v4_1.z.object({
            label: v4_1.z.string().describe('Short human label, e.g. "January 2026"'),
            startDate: v4_1.z.string().describe('Inclusive start date, YYYY-MM-DD'),
            endDate: v4_1.z.string().describe('Inclusive end date, YYYY-MM-DD'),
        }),
        periodB: v4_1.z.object({
            label: v4_1.z.string().describe('Short human label, e.g. "February 2026"'),
            startDate: v4_1.z.string().describe('Inclusive start date, YYYY-MM-DD'),
            endDate: v4_1.z.string().describe('Inclusive end date, YYYY-MM-DD'),
        }),
        categoryName: v4_1.z
            .string()
            .optional()
            .describe('Restrict both periods to this category'),
        transactionType: v4_1.z
            .enum(['INCOME', 'EXPENSE'])
            .optional()
            .describe('Restrict both periods to income or expenses'),
    }),
    outputSchema: v4_1.z.object({
        summary: v4_1.z.string(),
        transactionCount: v4_1.z.number(),
    }),
    execute: async (input, context) => {
        const userId = requireUserId(context);
        const shared = {
            categoryName: input.categoryName,
            transactionType: input.transactionType,
        };
        const [transactionsA, transactionsB] = await Promise.all([
            fetchTransactions(userId, Object.assign(Object.assign({}, shared), { startDate: input.periodA.startDate, endDate: input.periodA.endDate })),
            fetchTransactions(userId, Object.assign(Object.assign({}, shared), { startDate: input.periodB.startDate, endDate: input.periodB.endDate })),
        ]);
        const result = chatAggregationService_1.default.computeComparison({ label: input.periodA.label, transactions: transactionsA }, { label: input.periodB.label, transactions: transactionsB });
        return {
            summary: result.summary,
            transactionCount: result.transactionCount,
        };
    },
});
exports.getSpendingTrends = (0, tools_1.createTool)({
    id: 'getSpendingTrends',
    description: 'Returns how spending has moved over time, either overall or broken down by category, including the percentage change against the previous period.',
    inputSchema: v4_1.z.object({
        period: v4_1.z
            .enum(['daily', 'weekly', 'monthly', 'yearly'])
            .describe('Granularity of the trend points'),
        startDate: v4_1.z.string().optional().describe('Start date, YYYY-MM-DD'),
        endDate: v4_1.z.string().optional().describe('End date, YYYY-MM-DD'),
        categoryName: v4_1.z
            .string()
            .optional()
            .describe('Restrict the trend to a single category'),
        transactionType: v4_1.z.enum(['INCOME', 'EXPENSE']).optional(),
        byCategory: v4_1.z
            .boolean()
            .optional()
            .describe('Set true to break the trend down per category'),
    }),
    outputSchema: v4_1.z.object({
        summary: v4_1.z.string(),
    }),
    execute: async (input, context) => {
        const userId = requireUserId(context);
        const categoryId = await resolveCategoryId(input.categoryName);
        const request = Object.assign(Object.assign(Object.assign(Object.assign({ period: input.period }, (input.startDate ? { startDate: new Date(input.startDate) } : {})), (input.endDate ? { endDate: new Date(input.endDate) } : {})), (categoryId ? { categoryId } : {})), (input.transactionType
            ? { transactionType: input.transactionType }
            : {}));
        if (input.byCategory) {
            const trends = await trendService_1.default.getCategorySpendingTrends(request, userId);
            const lines = trends.map((trend) => `  ${trend.categoryName}: ₪${trend.totalAmount.toFixed(2)} (${trend.percentageChange >= 0 ? '+' : ''}${trend.percentageChange}% vs previous period, trending ${trend.trend})`);
            return {
                summary: lines.length
                    ? `Category trends (${input.period}):\n${lines.join('\n')}`
                    : 'No trend data found for that period.',
            };
        }
        const trend = await trendService_1.default.getSpendingTrends(request, userId);
        const points = trend.points.map((point) => `  ${point.date}: ₪${point.amount.toFixed(2)} (${point.count} transactions)`);
        return {
            summary: [
                `Spending trend (${trend.period}) from ${trend.startDate} to ${trend.endDate}:`,
                ...points,
                `\nTotal: ₪${trend.totalAmount.toFixed(2)}`,
                `Change vs previous period: ${trend.percentageChange >= 0 ? '+' : ''}${trend.percentageChange}% (trending ${trend.trend})`,
            ].join('\n'),
        };
    },
});
exports.assistantTools = {
    listCategories: exports.listCategories,
    listTransactions: exports.listTransactions,
    summarizeTransactions: exports.summarizeTransactions,
    comparePeriods: exports.comparePeriods,
    getSpendingTrends: exports.getSpendingTrends,
};
