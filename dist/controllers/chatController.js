"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const logger_1 = __importDefault(require("../utils/logger"));
class ChatController {
    constructor() {
        this.handleChatMessage = async (message, userId) => {
            try {
                logger_1.default.debug('Start handle chat message', { message, userId });
                if (!message) {
                    throw new Error('A message is required.');
                }
                const response = await chatService_1.default.getChatResponse(message, userId);
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
