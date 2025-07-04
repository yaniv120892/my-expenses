"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const logger_1 = __importDefault(require("../utils/logger"));
class ChatController {
    constructor() {
        this.handleChatMessage = async (messages, userId) => {
            try {
                logger_1.default.debug('Start handle chat message', { messages, userId });
                if (!messages || !Array.isArray(messages) || messages.length === 0) {
                    throw new Error('At least one message is required.');
                }
                const response = await chatService_1.default.getChatResponse(messages, userId);
                logger_1.default.debug('Done handle chat message', { response });
                return response;
            }
            catch (error) {
                logger_1.default.error('Failed to handle chat message', { error });
                throw error;
            }
        };
    }
}
exports.default = new ChatController();
