"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = __importDefault(require("../../utils/logger"));
class GeminiService {
    constructor() {
        this.modelName = 'gemini-pro'; // Use 'gemini-1.5-pro' if needed
        this.gemini = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    /** Analyzes user's expenses and provides insights */
    async analyzeExpenses(expenseSummary) {
        var _a, _b, _c, _d, _e, _f;
        try {
            logger_1.default.debug(`Start analyzing expenses`);
            const model = this.gemini.getGenerativeModel({ model: this.modelName });
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Analyze my recent expenses:\n\n${expenseSummary}, all expenses are in NIS.`,
                            },
                        ],
                    },
                ],
            });
            const analysis = (_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
            logger_1.default.debug(`Done analyzing expenses: ${analysis}`);
            return analysis || 'No expense analysis available.';
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue analyzing your expenses.';
        }
    }
    /** Suggests a category for a given expense description */
    async suggestCategory(expenseDescription, categoryOptions) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const model = this.gemini.getGenerativeModel({ model: this.modelName });
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Which category does this expense belong to?\n\n"${expenseDescription}", here are the available options:\n${categoryOptions.map((category) => `- ${category.name}\n, return only the category name`)}`,
                            },
                        ],
                    },
                ],
            });
            const aiSuggestedCategory = (_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
            const categoryId = (_g = categoryOptions.find((category) => category.name === aiSuggestedCategory)) === null || _g === void 0 ? void 0 : _g.id;
            return categoryId || 'No category found.';
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue suggesting a category.';
        }
    }
}
exports.GeminiService = GeminiService;
