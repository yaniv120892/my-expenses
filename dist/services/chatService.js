"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiServiceFactory_1 = __importDefault(require("../services/ai/aiServiceFactory"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
const chatAggregationService_1 = __importDefault(require("./chatAggregationService"));
class ChatService {
    constructor() {
        this.aiProvider = aiServiceFactory_1.default.getAIService();
        this.transactionRepository = transactionRepository_1.default;
        this.categoryRepository = categoryRepository_1.default;
    }
    async getChatResponse(messages, userId) {
        var _a;
        const currentDate = new Date().toISOString().split('T')[0];
        const conversation = messages
            .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
            .join('\n');
        const lastUserMessage = ((_a = [...messages].reverse().find((m) => m.sender === 'user')) === null || _a === void 0 ? void 0 : _a.text) || '';
        const intentPrompt = `
      You are a financial assistant chatbot. Your task is to understand the user's request about their transactions.
      The current date is ${currentDate}. Use this as a reference for relative date queries (e.g., 'last week', 'yesterday').

      Conversation so far:\n${conversation}\n

      Analyze the user's latest message: "${lastUserMessage}"

      Determine the user's intent and extract relevant parameters. Respond with a JSON object.

      Intents:
      - "list_transactions" — user wants to see specific transactions
      - "get_transaction_summary" — user wants totals, averages, or breakdowns
      - "compare_periods" — user wants to compare spending across time periods
      - "general_question" — general financial question not about their data

      Parameters to extract (if present):
      - category: the category name (e.g., "groceries", "restaurants")
      - startDate: in YYYY-MM-DD format
      - endDate: in YYYY-MM-DD format
      - transactionType: "INCOME" or "EXPENSE"

      Aggregation types — pick the one that best matches the user's question:
      - "total" — sum of transactions (e.g., "How much did I spend on X?")
      - "average" — average transaction value (e.g., "What's my average grocery expense?")
      - "count" — count of transactions (e.g., "How many transactions this month?")
      - "breakdown_by_category" — group by category (e.g., "Show spending by category")
      - "breakdown_by_month" — group by month (e.g., "Monthly spending trend")
      - "min_max" — highest and lowest (e.g., "What was my biggest expense?")
      - "list" — show individual transactions (e.g., "List my restaurant transactions")

      Examples:
      - "How much did I spend last month?" → { "intent": "get_transaction_summary", "parameters": { "startDate": "...", "endDate": "...", "transactionType": "EXPENSE" }, "aggregation": "total" }
      - "What's my average grocery expense?" → { "intent": "get_transaction_summary", "parameters": { "category": "groceries", "transactionType": "EXPENSE" }, "aggregation": "average" }
      - "Show me spending by category" → { "intent": "get_transaction_summary", "parameters": { "transactionType": "EXPENSE" }, "aggregation": "breakdown_by_category" }
      - "List my restaurant transactions" → { "intent": "list_transactions", "parameters": { "category": "restaurants" }, "aggregation": "list" }

      Respond ONLY with valid JSON, no markdown fences.
    `;
        try {
            const result = await this.aiProvider.generateContent(intentPrompt);
            const parsedResult = JSON.parse(result.replace(/```json/g, '').replace(/```/g, '').trim());
            const { intent, parameters } = parsedResult;
            if (intent !== 'list_transactions' &&
                intent !== 'get_transaction_summary' &&
                intent !== 'compare_periods') {
                return "I'm sorry, I can only help with questions about your transactions. Please try asking something like, 'How much did I spend on groceries last week?'";
            }
            const categoryId = await this.resolveCategoryId(parameters.category);
            const aggregationType = this.resolveAggregationType(parsedResult);
            const isListQuery = aggregationType === 'list';
            const transactions = await this.transactionRepository.getTransactions(Object.assign(Object.assign(Object.assign(Object.assign({ userId, page: 1, perPage: isListQuery ? 100 : 10000 }, (parameters.startDate
                ? { startDate: new Date(parameters.startDate) }
                : {})), (parameters.endDate
                ? { endDate: new Date(parameters.endDate) }
                : {})), (parameters.transactionType
                ? { transactionType: parameters.transactionType }
                : {})), (categoryId ? { categoryId } : {})));
            const aggregationResult = chatAggregationService_1.default.aggregate(transactions, aggregationType);
            const responsePrompt = `
        You are a friendly financial assistant. The user asked: "${lastUserMessage}"

        Here are the EXACT pre-computed results. Do NOT recalculate these numbers — use them as-is:
        ${aggregationResult.summary}

        ${aggregationResult.transactionCount} transactions were analyzed.

        Present this information conversationally to the user. Use the exact numbers provided. Keep currency in ₪ (Israeli Shekel).
      `;
            return await this.aiProvider.generateContent(responsePrompt);
        }
        catch (error) {
            console.error('Error in ChatService:', error);
            return "I'm sorry, something went wrong while I was trying to understand that. Please try again.";
        }
    }
    async resolveCategoryId(categoryName) {
        if (!categoryName)
            return undefined;
        const categories = await this.categoryRepository.getAllCategories();
        const lowerName = categoryName.toLowerCase();
        const exact = categories.find((c) => c.name.toLowerCase() === lowerName);
        if (exact)
            return exact.id;
        const partial = categories.find((c) => c.name.toLowerCase().includes(lowerName));
        return partial === null || partial === void 0 ? void 0 : partial.id;
    }
    resolveAggregationType(parsed) {
        if (parsed.aggregation)
            return parsed.aggregation;
        if (parsed.intent === 'list_transactions')
            return 'list';
        return 'total';
    }
}
exports.default = new ChatService();
