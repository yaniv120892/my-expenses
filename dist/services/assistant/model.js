"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssistantModel = getAssistantModel;
const DEFAULT_OPENAI_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_GEMINI_MODEL = 'google/gemini-2.5-flash';
function modelId(fallback) {
    const override = process.env.ASSISTANT_MODEL_ID;
    return override ? override : fallback;
}
/**
 * Resolves the assistant model from the same AI_PROVIDER switch used by
 * aiServiceFactory, so provider selection stays configured in one place.
 *
 * The API key is passed explicitly rather than relying on the provider's
 * default env var — this keeps the existing GEMINI_API_KEY name working
 * instead of requiring GOOGLE_GENERATIVE_AI_API_KEY.
 */
function getAssistantModel() {
    var _a;
    const provider = (_a = process.env.AI_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    // Optional OpenAI-compatible base URL, for a self-hosted or proxied endpoint.
    // The end-to-end tests point this at a local mock so the agent loop can run
    // without a real API key.
    const url = process.env.ASSISTANT_MODEL_URL;
    const baseUrl = url ? { url } : {};
    switch (provider) {
        case 'gemini':
            return Object.assign({ id: modelId(DEFAULT_GEMINI_MODEL), apiKey: process.env.GEMINI_API_KEY }, baseUrl);
        case 'chatgpt':
        default:
            return Object.assign({ id: modelId(DEFAULT_OPENAI_MODEL), apiKey: process.env.OPENAI_API_KEY }, baseUrl);
    }
}
