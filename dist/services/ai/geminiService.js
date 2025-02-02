"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    constructor() {
        this.modelName = 'gemini-pro'; // Use 'gemini-1.5-pro' if needed
        this.gemini = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    /** Analyzes user's expenses and provides insights */
    async analyzeExpenses(expenseSummary) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const model = this.gemini.getGenerativeModel({ model: this.modelName });
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `Analyze my recent expenses:\n\n${expenseSummary}` },
                        ],
                    },
                ],
            });
            return (((_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text) ||
                'No insights available.');
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue analyzing your expenses.';
        }
    }
    /** Suggests a category for a given expense description */
    async suggestCategory(expenseDescription) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const model = this.gemini.getGenerativeModel({ model: this.modelName });
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Which category does this expense belong to?\n\n"${expenseDescription}"`,
                            },
                        ],
                    },
                ],
            });
            return (((_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text) ||
                'No category suggestion available.');
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue suggesting a category.';
        }
    }
}
exports.GeminiService = GeminiService;
