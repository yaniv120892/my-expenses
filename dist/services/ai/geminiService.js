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
        this.modelName = 'gemini-2.0-flash';
        this.gemini = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    async generateContent(prompt) {
        var _a, _b, _c, _d, _e, _f;
        try {
            logger_1.default.debug(`Start generating content for prompt: ${prompt}`);
            const model = this.gemini.getGenerativeModel({ model: this.modelName });
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
            });
            const content = (_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
            logger_1.default.debug(`Done generating content for prompt: ${prompt}`);
            return content || '';
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue generating content.';
        }
    }
    async analyzeExpenses(expenseSummary, suffixPrompt) {
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
                                text: `Analyze my recent expenses:\n\n${expenseSummary}, all expenses are in NIS, response in hebrew, no more than 2 sentences, add new line after each sentence, ${suffixPrompt}`,
                            },
                        ],
                    },
                ],
            });
            const analysis = this.cleanGeminiResponse((_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text);
            logger_1.default.debug(`Done analyzing expenses: ${analysis}`);
            return analysis || 'No expense analysis available.';
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue analyzing your expenses.';
        }
    }
    async suggestCategory(expenseDescription, categoryOptions) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            logger_1.default.debug(`Start suggesting category for expense: ${expenseDescription}`);
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
            const aiSuggestedCategory = this.cleanGeminiResponse((_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text);
            const categoryId = (_g = categoryOptions.find((category) => category.name === aiSuggestedCategory)) === null || _g === void 0 ? void 0 : _g.id;
            logger_1.default.debug(`Done suggesting category for expense: ${expenseDescription} - ${aiSuggestedCategory}`);
            return categoryId || 'No category found.';
        }
        catch (error) {
            console.error('Gemini API Error:', error);
            return 'I encountered an issue suggesting a category.';
        }
    }
    async findMatchingTransaction(importedDescription, potentialMatches) {
        var _a, _b, _c, _d, _e, _f;
        try {
            logger_1.default.debug(`Start finding matching transaction for: ${importedDescription}`);
            if (!potentialMatches.length)
                return null;
            const model = this.gemini.getGenerativeModel({ model: this.modelName });
            const response = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `You are a helpful assistant that matches similar transaction descriptions. Your task is to find the most semantically similar transaction from a list of potential matches.

Rules:
1. Compare the imported description with each potential match
2. Consider semantic similarity, not just exact matches
3. Account for variations in merchant names and transaction descriptions
4. Return ONLY the ID of the best matching transaction
5. If no good match is found, return "none"
6. Do not explain your choice, just return the ID or "none"

Given this imported transaction description: "${importedDescription}"

Find the best matching transaction from this list:
${potentialMatches.map((t) => `- "${t.description}" (ID: ${t.id})`).join('\n')}

Return only the ID of the best match, or "none" if no good match exists.`,
                            },
                        ],
                    },
                ],
            });
            const result = this.cleanGeminiResponse((_f = (_e = (_d = (_c = (_b = (_a = response.response) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text);
            logger_1.default.debug(`Done finding matching transaction. Result: ${result}`);
            return result === 'none' ? null : result;
        }
        catch (error) {
            logger_1.default.error('Error finding matching transaction:', error);
            return null;
        }
    }
    cleanGeminiResponse(response) {
        if (!response)
            return '';
        return response
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/\n+/g, '\n')
            .trim();
    }
}
exports.GeminiService = GeminiService;
