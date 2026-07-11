"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agentService_1 = require("../services/agent/agentService");
const agentToolRegistry_1 = require("../services/agent/agentToolRegistry");
class ProofModelClient {
    constructor() {
        this.callCount = 0;
    }
    async createResponse(_messages) {
        this.callCount++;
        if (this.callCount === 1) {
            return {
                content: '',
                toolCalls: [
                    {
                        id: 'proof-tool-call-1',
                        name: 'create_transaction_draft',
                        arguments: {
                            description: 'Coffee',
                            value: 42,
                            date: '2026-07-11',
                            type: 'EXPENSE',
                            categoryName: 'Restaurants',
                            userId: 'malicious-model-user-id',
                        },
                    },
                ],
            };
        }
        return {
            content: 'I prepared the coffee transaction for confirmation.',
            toolCalls: [],
        };
    }
}
class ProofAgentRepository {
    constructor() {
        this.messages = [];
        this.pendingAction = null;
    }
    async getOrCreateConversation() {
        return {
            id: 'proof-conversation',
            userId: 'proof-user',
            title: null,
            createdAt: new Date('2026-07-11T00:00:00.000Z'),
            updatedAt: new Date('2026-07-11T00:00:00.000Z'),
            messages: this.messages,
        };
    }
    async addMessage(conversationId, sender, content) {
        const message = {
            id: `proof-message-${this.messages.length + 1}`,
            conversationId,
            sender,
            content,
            createdAt: new Date('2026-07-11T00:00:00.000Z'),
        };
        this.messages.push(message);
        return message;
    }
    async recordToolCall(params) {
        return {
            id: 'proof-recorded-tool-call',
            conversationId: params.conversationId,
            name: params.name,
            args: params.args,
            result: params.result,
            status: params.status,
            error: params.error || null,
            createdAt: new Date('2026-07-11T00:00:00.000Z'),
        };
    }
    async createPendingAction(conversationId, userId, _type, payload) {
        this.pendingAction = {
            id: 'proof-pending-action',
            conversationId,
            userId,
            type: 'CREATE_TRANSACTION',
            status: 'PENDING',
            payload,
            createdAt: new Date('2026-07-11T00:00:00.000Z'),
            updatedAt: new Date('2026-07-11T00:00:00.000Z'),
            confirmedAt: null,
            resultTransactionId: null,
        };
        return this.pendingAction;
    }
    async getPendingAction() {
        return this.pendingAction;
    }
    async markPendingActionConfirmed(_pendingActionId, transactionId) {
        if (this.pendingAction) {
            this.pendingAction = Object.assign(Object.assign({}, this.pendingAction), { status: 'CONFIRMED', resultTransactionId: transactionId, confirmedAt: new Date('2026-07-11T00:00:00.000Z') });
        }
    }
}
async function main() {
    var _a, _b;
    const agentRepository = new ProofAgentRepository();
    let createdTransactionUserId = '';
    const registry = new agentToolRegistry_1.AgentToolRegistry({
        agentRepository,
        categoryRepository: {
            getAllCategories: async () => [
                { id: 'category-restaurants', name: 'Restaurants' },
            ],
        },
        transactionService: {
            getTransactions: async () => [],
            getTransactionsSummary: async () => ({
                totalIncome: 0,
                totalExpense: 0,
            }),
            createTransaction: async (data) => {
                createdTransactionUserId = data.userId;
                return { id: 'proof-transaction' };
            },
        },
    });
    const service = new agentService_1.AgentService({
        agentRepository,
        modelClient: new ProofModelClient(),
        toolRegistry: registry,
    });
    const response = await service.sendMessage({ message: 'Add 42 shekels for coffee today' }, 'authenticated-proof-user');
    const pendingActionId = (_a = response.pendingAction) === null || _a === void 0 ? void 0 : _a.id;
    const pendingAction = response.pendingAction;
    if (!pendingActionId || !pendingAction) {
        throw new Error('Expected pending action to be created.');
    }
    const confirmation = await registry.confirmPendingAction(pendingActionId, 'authenticated-proof-user');
    console.log(JSON.stringify({
        conversationId: response.conversationId,
        assistantMessage: response.message.content,
        toolCall: (_b = response.toolCalls[0]) === null || _b === void 0 ? void 0 : _b.name,
        pendingActionStatus: pendingAction.status,
        pendingActionPayload: pendingAction.payload,
        confirmation,
        createdTransactionUserId,
    }, null, 2));
}
void main().catch((error) => {
    console.error(error);
    process.exit(1);
});
