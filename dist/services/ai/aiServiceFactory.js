"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatGPTService_1 = require("./chatGPTService");
const geminiService_1 = require("./geminiService");
class AIServiceFactory {
    static getAIService() {
        var _a;
        const aiProvider = (_a = process.env.AI_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        switch (aiProvider) {
            case 'gemini':
                return new geminiService_1.GeminiService();
            case 'chatgpt':
            default:
                return new chatGPTService_1.ChatGPTService();
        }
    }
}
exports.default = AIServiceFactory;
