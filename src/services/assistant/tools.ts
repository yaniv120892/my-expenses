// Deliberately zod/v4 rather than the bare `zod` import. Zod 3.25 ships both
// APIs, and the root export is v3 — which routes Mastra through its zod-v3
// adapter. That adapter's CommonJS build calls `zodToJsonSchema.default(...)`
// after an interop wrapper that leaves `default` as the module namespace, so
// every tool conversion throws "zod_to_json_schema.default is not a function"
// and no chat request can succeed. The v4 adapter uses zod's own
// `toJSONSchema` and has no such dependency.
import { z } from 'zod/v4';
import transactionRepository from '../../repositories/transactionRepository';
import categoryRepository from '../../repositories/categoryRepository';
import trendService from '../trendService';
import chatAggregationService from '../chatAggregationService';
import { Transaction } from '../../types/transaction';
import { AggregationType } from '../../types/chat';
import { TrendPeriod } from '../../types/trends';
import { loadMastra } from './esm';

export const USER_ID_CONTEXT_KEY = 'userId';

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
function requireUserId(context: {
  requestContext?: { get: (key: string) => unknown };
}): string {
  const userId = context.requestContext?.get(USER_ID_CONTEXT_KEY);

  if (typeof userId !== 'string' || !userId) {
    throw new Error('Assistant tool called without an authenticated user');
  }

  return userId;
}

const dateFilterSchema = z.object({
  startDate: z
    .string()
    .optional()
    .describe('Inclusive start date in YYYY-MM-DD format'),
  endDate: z
    .string()
    .optional()
    .describe('Inclusive end date in YYYY-MM-DD format'),
  categoryName: z
    .string()
    .optional()
    .describe('Category name, as returned by listCategories'),
  transactionType: z
    .enum(['INCOME', 'EXPENSE'])
    .optional()
    .describe('Restrict to income or expenses'),
  searchTerm: z
    .string()
    .optional()
    .describe('Free-text term matched against the transaction description'),
});

/** Inferred from the schema so the two cannot drift apart. */
type DateFilterInput = z.infer<typeof dateFilterSchema> & {
  /** Set internally once the category name has been resolved. */
  categoryId?: string;
};

/** Every tool reports the same shape. */
const summaryOutputSchema = z.object({
  summary: z.string(),
  transactionCount: z.number(),
});

const periodSchema = (exampleLabel: string) =>
  z.object({
    label: z.string().describe(`Short human label, e.g. "${exampleLabel}"`),
    startDate: z.string().describe('Inclusive start date, YYYY-MM-DD'),
    endDate: z.string().describe('Inclusive end date, YYYY-MM-DD'),
  });

/**
 * Resolves a category name to an id, exact match first then partial. Carried
 * over from the previous chatService implementation.
 */
async function resolveCategoryId(
  categoryName?: string,
): Promise<string | undefined> {
  if (!categoryName) return undefined;

  const categories = await categoryRepository.getAllCategories();
  const lowerName = categoryName.toLowerCase();

  const exact = categories.find((c) => c.name.toLowerCase() === lowerName);
  if (exact) return exact.id;

  const partial = categories.find((c) =>
    c.name.toLowerCase().includes(lowerName),
  );
  return partial?.id;
}

/**
 * Shared body for the tools that fetch, aggregate, and report. They differ only
 * in which aggregation they ask for.
 */
async function summarize(
  userId: string,
  filters: DateFilterInput,
  aggregation: AggregationType,
): Promise<{ summary: string; transactionCount: number }> {
  const transactions = await fetchTransactions(userId, filters);
  const { summary, transactionCount } = chatAggregationService.aggregate(
    transactions,
    aggregation,
  );
  return { summary, transactionCount };
}

async function fetchTransactions(
  userId: string,
  filters: DateFilterInput,
): Promise<Transaction[]> {
  // Callers that fetch more than once for the same category resolve it up front
  // and pass the id, so the category list is not fetched again per period.
  const categoryId =
    filters.categoryId ?? (await resolveCategoryId(filters.categoryName));

  return transactionRepository.getTransactions({
    userId,
    page: 1,
    perPage: MAX_TRANSACTIONS,
    ...(filters.startDate ? { startDate: new Date(filters.startDate) } : {}),
    ...(filters.endDate ? { endDate: new Date(filters.endDate) } : {}),
    ...(filters.transactionType
      ? { transactionType: filters.transactionType }
      : {}),
    ...(filters.searchTerm ? { searchTerm: filters.searchTerm } : {}),
    ...(categoryId ? { categoryId } : {}),
  });
}

/**
 * Builds the tool set. Async because `createTool` comes from Mastra's ESM
 * build, which can only be reached through a dynamic import (see ./esm).
 */
export async function buildAssistantTools() {
  const { createTool } = await loadMastra();

  const listCategories = createTool({
    id: 'listCategories',
    description:
      'Lists every category available to the user. Call this before filtering by category so you use a real category name rather than guessing one.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      categories: z.array(z.string()),
    }),
    execute: async (_input, context) => {
      requireUserId(context);
      const categories = await categoryRepository.getAllCategories();
      return { categories: categories.map((category) => category.name) };
    },
  });

  const listTransactions = createTool({
    id: 'listTransactions',
    description:
      'Lists individual transactions matching the given filters. Use this when the user wants to see specific transactions rather than a total.',
    inputSchema: dateFilterSchema,
    outputSchema: summaryOutputSchema,
    execute: async (input, context) =>
      summarize(requireUserId(context), input, 'list'),
  });

  const summarizeTransactions = createTool({
    id: 'summarizeTransactions',
    description:
      'Computes a figure over the transactions matching the filters — a total, average, count, category breakdown, monthly breakdown, or highest/lowest. All arithmetic is done server-side; use the returned numbers exactly as given.',
    inputSchema: dateFilterSchema.extend({
      aggregation: z
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
    execute: async (input, context) =>
      summarize(requireUserId(context), input, input.aggregation),
  });

  const comparePeriods = createTool({
    id: 'comparePeriods',
    description:
      'Compares two date ranges and returns both totals along with the difference and percentage change, all computed server-side. Always use this for comparisons instead of calling summarizeTransactions twice and subtracting the results yourself.',
    inputSchema: z.object({
      periodA: periodSchema('January 2026'),
      periodB: periodSchema('February 2026'),
      categoryName: z
        .string()
        .optional()
        .describe('Restrict both periods to this category'),
      transactionType: z
        .enum(['INCOME', 'EXPENSE'])
        .optional()
        .describe('Restrict both periods to income or expenses'),
    }),
    outputSchema: summaryOutputSchema,
    execute: async (input, context) => {
      const userId = requireUserId(context);

      // Resolved once and shared: otherwise each period re-fetches the whole
      // category list to map the same name.
      const shared: DateFilterInput = {
        categoryId: await resolveCategoryId(input.categoryName),
        transactionType: input.transactionType,
      };

      const [transactionsA, transactionsB] = await Promise.all([
        fetchTransactions(userId, {
          ...shared,
          startDate: input.periodA.startDate,
          endDate: input.periodA.endDate,
        }),
        fetchTransactions(userId, {
          ...shared,
          startDate: input.periodB.startDate,
          endDate: input.periodB.endDate,
        }),
      ]);

      const result = chatAggregationService.computeComparison(
        { label: input.periodA.label, transactions: transactionsA },
        { label: input.periodB.label, transactions: transactionsB },
      );

      return {
        summary: result.summary,
        transactionCount: result.transactionCount,
      };
    },
  });

  const getSpendingTrends = createTool({
    id: 'getSpendingTrends',
    description:
      'Returns how spending has moved over time, either overall or broken down by category, including the percentage change against the previous period.',
    inputSchema: z.object({
      period: z
        .enum(['daily', 'weekly', 'monthly', 'yearly'])
        .describe('Granularity of the trend points'),
      startDate: z.string().optional().describe('Start date, YYYY-MM-DD'),
      endDate: z.string().optional().describe('End date, YYYY-MM-DD'),
      categoryName: z
        .string()
        .optional()
        .describe('Restrict the trend to a single category'),
      transactionType: z.enum(['INCOME', 'EXPENSE']).optional(),
      byCategory: z
        .boolean()
        .optional()
        .describe('Set true to break the trend down per category'),
    }),
    outputSchema: z.object({
      summary: z.string(),
    }),
    execute: async (input, context) => {
      const userId = requireUserId(context);
      const categoryId = await resolveCategoryId(input.categoryName);

      const request = {
        period: input.period as TrendPeriod,
        ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
        ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(input.transactionType
          ? { transactionType: input.transactionType }
          : {}),
      };

      if (input.byCategory) {
        const trends = await trendService.getCategorySpendingTrends(
          request,
          userId,
        );
        const lines = trends.map(
          (trend) =>
            `  ${trend.categoryName}: ${chatAggregationService.formatCurrency(trend.totalAmount)} (${chatAggregationService.formatPercentChange(trend.percentageChange)} vs previous period, trending ${trend.trend})`,
        );

        return {
          summary: lines.length
            ? `Category trends (${input.period}):\n${lines.join('\n')}`
            : 'No trend data found for that period.',
        };
      }

      const trend = await trendService.getSpendingTrends(request, userId);
      const points = trend.points.map(
        (point) =>
          `  ${point.date}: ${chatAggregationService.formatCurrency(point.amount)} (${point.count} transactions)`,
      );

      return {
        summary: [
          `Spending trend (${trend.period}) from ${trend.startDate} to ${trend.endDate}:`,
          ...points,
          `\nTotal: ${chatAggregationService.formatCurrency(trend.totalAmount)}`,
          `Change vs previous period: ${chatAggregationService.formatPercentChange(trend.percentageChange)} (trending ${trend.trend})`,
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
