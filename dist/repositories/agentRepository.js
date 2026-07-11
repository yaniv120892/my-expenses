"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRepository = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class AgentRepository {
    async getOrCreateConversation(conversationId, userId) {
        if (conversationId) {
            const existing = await client_1.default.agentConversation.findFirst({
                where: { id: conversationId, userId },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            });
            if (!existing) {
                throw new Error('Agent conversation not found.');
            }
            return this.mapConversation(existing);
        }
        const conversation = await client_1.default.agentConversation.create({
            data: { userId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        return this.mapConversation(conversation);
    }
    async addMessage(conversationId, sender, content) {
        const message = await client_1.default.agentMessage.create({
            data: { conversationId, sender, content },
        });
        return this.mapMessage(message);
    }
    async recordToolCall(params) {
        const toolCall = await client_1.default.agentToolCall.create({
            data: Object.assign({ conversationId: params.conversationId, name: params.name, args: params.args, status: params.status, error: params.error }, (params.result ? { result: params.result } : {})),
        });
        return this.mapToolCall(toolCall);
    }
    async createPendingAction(conversationId, userId, type, payload) {
        const pendingAction = await client_1.default.agentPendingAction.create({
            data: { conversationId, userId, type, payload },
        });
        return this.mapPendingAction(pendingAction);
    }
    async getPendingAction(pendingActionId, userId) {
        const pendingAction = await client_1.default.agentPendingAction.findFirst({
            where: { id: pendingActionId, userId },
        });
        return pendingAction ? this.mapPendingAction(pendingAction) : null;
    }
    async markPendingActionConfirmed(pendingActionId, transactionId) {
        await client_1.default.agentPendingAction.update({
            where: { id: pendingActionId },
            data: {
                status: 'CONFIRMED',
                resultTransactionId: transactionId,
                confirmedAt: new Date(),
            },
        });
    }
    mapConversation(conversation) {
        return {
            id: conversation.id,
            userId: conversation.userId,
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: conversation.messages.map((message) => this.mapMessage(message)),
        };
    }
    mapMessage(message) {
        return {
            id: message.id,
            conversationId: message.conversationId,
            sender: message.sender,
            content: message.content,
            createdAt: message.createdAt,
        };
    }
    mapToolCall(toolCall) {
        return {
            id: toolCall.id,
            conversationId: toolCall.conversationId,
            name: toolCall.name,
            args: this.toRecord(toolCall.args),
            result: toolCall.result ? this.toRecord(toolCall.result) : null,
            status: toolCall.status,
            error: toolCall.error,
            createdAt: toolCall.createdAt,
        };
    }
    mapPendingAction(pendingAction) {
        return {
            id: pendingAction.id,
            conversationId: pendingAction.conversationId,
            userId: pendingAction.userId,
            type: pendingAction.type,
            status: pendingAction.status,
            payload: pendingAction.payload,
            createdAt: pendingAction.createdAt,
            updatedAt: pendingAction.updatedAt,
            confirmedAt: pendingAction.confirmedAt,
            resultTransactionId: pendingAction.resultTransactionId,
        };
    }
    toRecord(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }
        return {};
    }
}
exports.AgentRepository = AgentRepository;
exports.default = new AgentRepository();
