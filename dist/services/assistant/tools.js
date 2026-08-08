"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ID_CONTEXT_KEY = void 0;
exports.buildAssistantTools = buildAssistantTools;
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
const esm_1 = require("./esm");
exports.USER_ID_CONTEXT_KEY = 'userId';
/**
 * Caps how many transactions a single tool call aggregates over.
 *
 * Note this bounds the rows returned, not the rows read: getTransactions routes
 * everything without a searchTerm through its smart-search path, which selects
 * all matching rows and paginates in memory. Making that query bounded means
 * changing the shared repository, which would alter search ranking for its
 * other callers — worth doing, but not from here.
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
const dateFilterSchema = v4_1.z.object({
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
});
/** Every tool reports the same shape. */
const summaryOutputSchema = v4_1.z.object({
    summary: v4_1.z.string(),
    transactionCount: v4_1.z.number(),
});
const periodSchema = (exampleLabel) => v4_1.z.object({
    label: v4_1.z.string().describe(`Short human label, e.g. "${exampleLabel}"`),
    startDate: v4_1.z.string().describe('Inclusive start date, YYYY-MM-DD'),
    endDate: v4_1.z.string().describe('Inclusive end date, YYYY-MM-DD'),
});
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
/**
 * Shared body for the tools that fetch, aggregate, and report. They differ only
 * in which aggregation they ask for.
 */
async function summarize(userId, filters, aggregation) {
    const transactions = await fetchTransactions(userId, filters);
    const { summary, transactionCount } = chatAggregationService_1.default.aggregate(transactions, aggregation);
    return { summary, transactionCount };
}
async function fetchTransactions(userId, filters) {
    var _a;
    // Callers that fetch more than once for the same category resolve it up front
    // and pass the id, so the category list is not fetched again per period.
    const categoryId = (_a = filters.categoryId) !== null && _a !== void 0 ? _a : (await resolveCategoryId(filters.categoryName));
    return transactionRepository_1.default.getTransactions(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ userId, page: 1, perPage: MAX_TRANSACTIONS }, (filters.startDate ? { startDate: new Date(filters.startDate) } : {})), (filters.endDate ? { endDate: new Date(filters.endDate) } : {})), (filters.transactionType
        ? { transactionType: filters.transactionType }
        : {})), (filters.searchTerm ? { searchTerm: filters.searchTerm } : {})), (categoryId ? { categoryId } : {})));
}
/**
 * Builds the tool set. Async because `createTool` comes from Mastra's ESM
 * build, which can only be reached through a dynamic import (see ./esm).
 */
async function buildAssistantTools() {
    const { createTool } = await (0, esm_1.loadMastra)();
    const listCategories = createTool({
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
    const listTransactions = createTool({
        id: 'listTransactions',
        description: 'Lists individual transactions matching the given filters. Use this when the user wants to see specific transactions rather than a total.',
        inputSchema: dateFilterSchema,
        outputSchema: summaryOutputSchema,
        execute: async (input, context) => summarize(requireUserId(context), input, 'list'),
    });
    const summarizeTransactions = createTool({
        id: 'summarizeTransactions',
        description: 'Computes a figure over the transactions matching the filters — a total, average, count, category breakdown, monthly breakdown, or highest/lowest. All arithmetic is done server-side; use the returned numbers exactly as given.',
        inputSchema: dateFilterSchema.extend({
            aggregation: v4_1.z
                .enum([
                'total',
                'average',
                'count',
                'breakdown_by_category',
                'breakdown_by_month',
                'min_max',
            ])
                .describe('Which figure to compute'),
        }),
        outputSchema: summaryOutputSchema,
        execute: async (input, context) => summarize(requireUserId(context), input, input.aggregation),
    });
    const comparePeriods = createTool({
        id: 'comparePeriods',
        description: 'Compares two date ranges and returns both totals along with the difference and percentage change, all computed server-side. Always use this for comparisons instead of calling summarizeTransactions twice and subtracting the results yourself.',
        inputSchema: v4_1.z.object({
            periodA: periodSchema('January 2026'),
            periodB: periodSchema('February 2026'),
            categoryName: v4_1.z
                .string()
                .optional()
                .describe('Restrict both periods to this category'),
            transactionType: v4_1.z
                .enum(['INCOME', 'EXPENSE'])
                .optional()
                .describe('Restrict both periods to income or expenses'),
        }),
        outputSchema: summaryOutputSchema,
        execute: async (input, context) => {
            const userId = requireUserId(context);
            // Resolved once and shared: otherwise each period re-fetches the whole
            // category list to map the same name.
            const shared = {
                categoryId: await resolveCategoryId(input.categoryName),
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
    const getSpendingTrends = createTool({
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
                const lines = trends.map((trend) => `  ${trend.categoryName}: ${chatAggregationService_1.default.formatCurrency(trend.totalAmount)} (${chatAggregationService_1.default.formatPercentChange(trend.percentageChange)} vs previous period, trending ${trend.trend})`);
                return {
                    summary: lines.length
                        ? `Category trends (${input.period}):\n${lines.join('\n')}`
                        : 'No trend data found for that period.',
                };
            }
            const trend = await trendService_1.default.getSpendingTrends(request, userId);
            const points = trend.points.map((point) => `  ${point.date}: ${chatAggregationService_1.default.formatCurrency(point.amount)} (${point.count} transactions)`);
            return {
                summary: [
                    `Spending trend (${trend.period}) from ${trend.startDate} to ${trend.endDate}:`,
                    ...points,
                    `\nTotal: ${chatAggregationService_1.default.formatCurrency(trend.totalAmount)}`,
                    `Change vs previous period: ${chatAggregationService_1.default.formatPercentChange(trend.percentageChange)} (trending ${trend.trend})`,
                ].join('\n'),
            };
        },
    });
    return {
        listCategories,
        listTransactions,
        summarizeTransactions,
        comparePeriods,
        getSpendingTrends,
    };
}
