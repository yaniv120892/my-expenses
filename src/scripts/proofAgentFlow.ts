import { AgentService } from '../services/agent/agentService';
import { AgentToolRegistry } from '../services/agent/agentToolRegistry';
import {
  AgentConversation,
  AgentMessage,
  AgentModelClient,
  AgentPendingAction,
  AgentRuntimeMessage,
  CreateTransactionPendingActionPayload,
} from '../types/agent';

class ProofModelClient implements AgentModelClient {
  private callCount = 0;

  public async createResponse(
    _messages: AgentRuntimeMessage[],
  ): Promise<{
    content: string;
    toolCalls: {
      id: string;
      name: 'create_transaction_draft';
      arguments: Record<string, unknown>;
    }[];
  }> {
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
  private readonly messages: AgentMessage[] = [];
  private pendingAction: AgentPendingAction | null = null;

  public async getOrCreateConversation(): Promise<AgentConversation> {
    return {
      id: 'proof-conversation',
      userId: 'proof-user',
      title: null,
      createdAt: new Date('2026-07-11T00:00:00.000Z'),
      updatedAt: new Date('2026-07-11T00:00:00.000Z'),
      messages: this.messages,
    };
  }

  public async addMessage(
    conversationId: string,
    sender: AgentMessage['sender'],
    content: string,
  ): Promise<AgentMessage> {
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

  public async recordToolCall(params: {
    conversationId: string;
    name: string;
    args: Record<string, unknown>;
    result: Record<string, unknown> | null;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
  }) {
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

  public async createPendingAction(
    conversationId: string,
    userId: string,
    _type: 'CREATE_TRANSACTION',
    payload: CreateTransactionPendingActionPayload,
  ): Promise<AgentPendingAction> {
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

  public async getPendingAction(): Promise<AgentPendingAction | null> {
    return this.pendingAction;
  }

  public async markPendingActionConfirmed(
    _pendingActionId: string,
    transactionId: string,
  ): Promise<void> {
    if (this.pendingAction) {
      this.pendingAction = {
        ...this.pendingAction,
        status: 'CONFIRMED',
        resultTransactionId: transactionId,
        confirmedAt: new Date('2026-07-11T00:00:00.000Z'),
      };
    }
  }
}

async function main(): Promise<void> {
  const agentRepository = new ProofAgentRepository();
  let createdTransactionUserId = '';
  const registry = new AgentToolRegistry({
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
  const service = new AgentService({
    agentRepository,
    modelClient: new ProofModelClient(),
    toolRegistry: registry,
  });

  const response = await service.sendMessage(
    { message: 'Add 42 shekels for coffee today' },
    'authenticated-proof-user',
  );
  const pendingActionId = response.pendingAction?.id;
  const pendingAction = response.pendingAction;
  if (!pendingActionId || !pendingAction) {
    throw new Error('Expected pending action to be created.');
  }

  const confirmation = await registry.confirmPendingAction(
    pendingActionId,
    'authenticated-proof-user',
  );

  console.log(
    JSON.stringify(
      {
        conversationId: response.conversationId,
        assistantMessage: response.message.content,
        toolCall: response.toolCalls[0]?.name,
        pendingActionStatus: pendingAction.status,
        pendingActionPayload: pendingAction.payload,
        confirmation,
        createdTransactionUserId,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
