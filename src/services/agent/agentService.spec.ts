import assert from 'assert/strict';
import { AgentService } from './agentService';
import {
  AgentConversation,
  AgentMessage,
  AgentModelClient,
  AgentPendingAction,
  AgentRuntimeMessage,
  AgentToolCall,
  AgentToolExecutionRequest,
  AgentToolResult,
} from '../../types/agent';

async function testAgentTurnExecutesToolAndReturnsPendingAction(): Promise<void> {
  const messages: AgentMessage[] = [];
  const toolCalls: AgentToolCall[] = [];
  const pendingAction = createPendingAction();

  const service = new AgentService({
    agentRepository: {
      getOrCreateConversation: async () => createConversation(messages),
      addMessage: async (conversationId, sender, content) => {
        const message = createMessage(conversationId, sender, content);
        messages.push(message);
        return message;
      },
      recordToolCall: async (params) => {
        const toolCall = createToolCall(params);
        toolCalls.push(toolCall);
        return toolCall;
      },
    },
    modelClient: createModelClient(),
    toolRegistry: {
      executeTool: async (
        request: AgentToolExecutionRequest,
      ): Promise<AgentToolResult> => {
        assert.equal(request.userId, 'user-1');
        assert.equal(request.name, 'create_transaction_draft');
        return {
          summary: 'Created a pending transaction action.',
          data: { pendingActionId: pendingAction.id },
          pendingAction,
        };
      },
    },
  });

  const response = await service.sendMessage(
    {
      message: 'Add 42 shekels for coffee today',
    },
    'user-1',
  );

  assert.equal(response.conversationId, 'conversation-1');
  assert.equal(response.message.sender, 'ASSISTANT');
  assert.equal(response.pendingAction?.id, 'pending-1');
  assert.equal(messages[0].sender, 'USER');
  assert.equal(messages[1].sender, 'ASSISTANT');
  assert.equal(toolCalls[0].name, 'create_transaction_draft');
  assert.equal(toolCalls[0].status, 'SUCCESS');
}

function createModelClient(): AgentModelClient {
  let callCount = 0;

  return {
    createResponse: async (_messages: AgentRuntimeMessage[]) => {
      callCount++;

      if (callCount === 1) {
        return {
          content: '',
          toolCalls: [
            {
              id: 'tool-call-1',
              name: 'create_transaction_draft',
              arguments: {
                description: 'Coffee',
                value: 42,
                date: '2026-07-11',
                type: 'EXPENSE',
                categoryId: 'category-1',
              },
            },
          ],
        };
      }

      return {
        content: 'I prepared that transaction for confirmation.',
        toolCalls: [],
      };
    },
  };
}

function createConversation(messages: AgentMessage[]): AgentConversation {
  return {
    id: 'conversation-1',
    userId: 'user-1',
    title: null,
    createdAt: new Date('2026-07-11T00:00:00.000Z'),
    updatedAt: new Date('2026-07-11T00:00:00.000Z'),
    messages,
  };
}

function createMessage(
  conversationId: string,
  sender: AgentMessage['sender'],
  content: string,
): AgentMessage {
  return {
    id: `message-${sender.toLowerCase()}`,
    conversationId,
    sender,
    content,
    createdAt: new Date('2026-07-11T00:00:00.000Z'),
  };
}

function createToolCall(params: {
  conversationId: string;
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: AgentToolCall['status'];
  error?: string;
}): AgentToolCall {
  return {
    id: 'recorded-tool-call-1',
    conversationId: params.conversationId,
    name: params.name,
    args: params.args,
    result: params.result,
    status: params.status,
    error: params.error || null,
    createdAt: new Date('2026-07-11T00:00:00.000Z'),
  };
}

function createPendingAction(): AgentPendingAction {
  return {
    id: 'pending-1',
    conversationId: 'conversation-1',
    userId: 'user-1',
    type: 'CREATE_TRANSACTION',
    status: 'PENDING',
    payload: {
      description: 'Coffee',
      value: 42,
      date: '2026-07-11',
      type: 'EXPENSE',
      categoryId: 'category-1',
    },
    createdAt: new Date('2026-07-11T00:00:00.000Z'),
    updatedAt: new Date('2026-07-11T00:00:00.000Z'),
    confirmedAt: null,
    resultTransactionId: null,
  };
}

async function main(): Promise<void> {
  await testAgentTurnExecutesToolAndReturnsPendingAction();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
