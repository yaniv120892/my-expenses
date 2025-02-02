"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPTService = void 0;
const openai_1 = __importDefault(require("openai"));
class ChatGPTService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /** Analyzes user's expenses and provides insights */
    async analyzeExpenses(expenseSummary) {
        var _a;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo', // Ensure you use a model you have access to
                messages: [
                    {
                        role: 'system',
                        content: 'You are a financial assistant helping users analyze their expenses.',
                    },
                    {
                        role: 'user',
                        content: `Analyze my recent expenses:\n\n${expenseSummary}`,
                    },
                ],
                max_tokens: 200,
            });
            return ((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || 'No insights available.';
        }
        catch (error) {
            console.error('ChatGPT API Error:', error);
            return 'I encountered an issue analyzing your expenses.';
        }
    }
    /** Suggests a category for a given expense description */
    async suggestCategory(expenseDescription, categoryOptions) {
        var _a;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a financial assistant helping users categorize their expenses.',
                    },
                    {
                        role: 'user',
                        content: `Which category does this expense belong to?\n\n"${expenseDescription}", here are the available options:\n${categoryOptions.map((category) => `- ${category.name}\n, return only the category name`)}`,
                    },
                ],
                max_tokens: 50,
            });
            const aiSuggestedCategory = (_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content;
            const suggestedCategory = categoryOptions.find((category) => category.name === aiSuggestedCategory);
            return (suggestedCategory === null || suggestedCategory === void 0 ? void 0 : suggestedCategory.id) || 'No category found.';
        }
        catch (error) {
            console.error('ChatGPT API Error:', error);
            return 'I encountered an issue suggesting a category.';
        }
    }
}
exports.ChatGPTService = ChatGPTService;
