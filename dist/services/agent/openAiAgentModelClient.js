"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiAgentModelClient = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAiAgentModelClient {
    constructor() {
        this.openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
        this.model = process.env.AGENT_MODEL || 'gpt-4o-mini';
    }
    async createResponse(messages) {
        var _a, _b;
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required for agent responses.');
        }
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: messages.map((message) => this.mapMessage(message)),
            tools: this.getTools(),
            tool_choice: 'auto',
            temperature: 0.2,
        });
        const message = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message;
        return {
            content: (message === null || message === void 0 ? void 0 : message.content) || '',
            toolCalls: ((_b = message === null || message === void 0 ? void 0 : message.tool_calls) === null || _b === void 0 ? void 0 : _b.map((toolCall) => ({
                id: toolCall.id,
                name: toolCall.function.name,
                arguments: this.parseArguments(toolCall.function.arguments),
            }))) || [],
        };
    }
    mapMessage(message) {
        if (message.role === 'tool') {
            return {
                role: 'tool',
                tool_call_id: message.toolCallId || 'tool-call',
                content: message.content,
            };
        }
        return {
            role: message.role,
            content: message.content,
        };
    }
    parseArguments(rawArguments) {
        try {
            const parsed = JSON.parse(rawArguments);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (_a) {
            return {};
        }
        return {};
    }
    getTools() {
        return [
            {
                type: 'function',
                function: {
                    name: 'search_transactions',
                    description: 'Search the authenticated user transactions. Never include or infer userId.',
                    parameters: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            startDate: { type: 'string', description: 'YYYY-MM-DD' },
                            endDate: { type: 'string', description: 'YYYY-MM-DD' },
                            categoryId: { type: 'string' },
                            transactionType: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                            searchTerm: { type: 'string' },
                            page: { type: 'number' },
                            perPage: { type: 'number' },
                        },
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_transaction_summary',
                    description: 'Get deterministic income and expense totals for the authenticated user.',
                    parameters: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            startDate: { type: 'string', description: 'YYYY-MM-DD' },
                            endDate: { type: 'string', description: 'YYYY-MM-DD' },
                            categoryId: { type: 'string' },
                            transactionType: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                        },
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'list_categories',
                    description: 'List valid transaction categories.',
                    parameters: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {},
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'create_transaction_draft',
                    description: 'Create a pending transaction draft. This does not write a transaction until the user confirms it.',
                    parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['description', 'value', 'date', 'type'],
                        properties: {
                            description: { type: 'string' },
                            value: { type: 'number' },
                            date: { type: 'string', description: 'YYYY-MM-DD' },
                            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                            categoryId: { type: 'string' },
                            categoryName: { type: 'string' },
                        },
                    },
                },
            },
        ];
    }
}
exports.OpenAiAgentModelClient = OpenAiAgentModelClient;
