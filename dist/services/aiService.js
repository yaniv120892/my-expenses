"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const openai_1 = __importDefault(require("openai"));
class AIService {
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
                model: 'gpt-4',
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
            console.error('AI API Error:', error);
            return 'I encountered an issue analyzing your expenses.';
        }
    }
    /** Suggests a category for a given expense description */
    async suggestCategory(expenseDescription) {
        var _a;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI that classifies expenses into predefined categories like Food, Travel, Rent, Entertainment, Shopping, Healthcare, Utilities, Transportation, or Miscellaneous.',
                    },
                    {
                        role: 'user',
                        content: `Which category does this expense belong to?\n\n"${expenseDescription}"`,
                    },
                ],
                max_tokens: 50,
            });
            return (((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) ||
                'No category suggestion available.');
        }
        catch (error) {
            console.error('AI API Error:', error);
            return 'I encountered an issue suggesting a category.';
        }
    }
}
exports.aiService = new AIService();
