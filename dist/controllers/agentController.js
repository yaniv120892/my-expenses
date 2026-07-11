"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agentService_1 = require("../services/agent/agentService");
const agentToolRegistry_1 = require("../services/agent/agentToolRegistry");
const logger_1 = __importDefault(require("../utils/logger"));
class AgentController {
    constructor() {
        this.agentService = new agentService_1.AgentService();
        this.agentToolRegistry = new agentToolRegistry_1.AgentToolRegistry();
    }
    async sendMessage(request, userId) {
        var _a;
        logger_1.default.debug('Start agent message', {
            conversationId: request.conversationId,
            userId,
        });
        const response = await this.agentService.sendMessage(request, userId);
        logger_1.default.debug('Done agent message', {
            conversationId: response.conversationId,
            toolCallCount: response.toolCalls.length,
            pendingActionId: (_a = response.pendingAction) === null || _a === void 0 ? void 0 : _a.id,
        });
        return response;
    }
    async confirmPendingAction(pendingActionId, userId) {
        logger_1.default.debug('Start confirm agent pending action', {
            pendingActionId,
            userId,
        });
        const result = await this.agentToolRegistry.confirmPendingAction(pendingActionId, userId);
        logger_1.default.debug('Done confirm agent pending action', {
            pendingActionId,
            transactionId: result.transactionId,
        });
        return {
            pendingActionId,
            transactionId: result.transactionId,
        };
    }
}
exports.default = new AgentController();
