import assert from 'assert/strict';
import { AgentToolRegistry } from './agentToolRegistry';
import {
  AgentPendingAction,
  AgentPendingActionStatus,
  CreateTransactionPendingActionPayload,
} from '../../types/agent';

async function testSearchTransactionsUsesAuthenticatedUserId(): Promise<void> {
  let receivedUserId = '';
  const registry = createRegistry({
    transactionService: {
      getTransactions: async (filters: any) => {
        receivedUserId = filters.userId;
        return [];
      },
      getTransactionsSummary: async () => ({ totalIncome: 0, totalExpense: 0 }),
      createTransaction: async () => ({ id: 'unexpected' }),
    },
  });

  await registry.executeTool({
    conversationId: 'conversation-1',
    userId: 'authenticated-user',
    name: 'search_transactions',
    arguments: {
      userId: 'model-supplied-user',
      searchTerm: 'coffee',
      page: 1,
      perPage: 10,
    },
  });

  assert.equal(receivedUserId, 'authenticated-user');
}

async function testCreateTransactionToolCreatesPendingActionOnly(): Promise<void> {
  let createTransactionCalled = false;
  let pendingPayload: CreateTransactionPendingActionPayload | undefined;

  const registry = createRegistry({
    transactionService: {
      getTransactions: async () => [],
      getTransactionsSummary: async () => ({ totalIncome: 0, totalExpense: 0 }),
      createTransaction: async () => {
        createTransactionCalled = true;
        return { id: 'unexpected' };
      },
    },
    agentRepository: {
      createPendingAction: async (_conversationId, _userId, _type, payload) => {
        pendingPayload = payload as CreateTransactionPendingActionPayload;
        return createPendingAction({
          id: 'pending-1',
          payload: pendingPayload,
        });
      },
      getPendingAction: async () => null,
      markPendingActionConfirmed: async () => undefined,
    },
  });

  const result = await registry.executeTool({
    conversationId: 'conversation-1',
    userId: 'user-1',
    name: 'create_transaction_draft',
    arguments: {
      description: 'Coffee',
      value: 42,
      date: '2026-07-11',
      type: 'EXPENSE',
      categoryId: 'category-1',
    },
  });

  assert.equal(createTransactionCalled, false);
  assert.equal(result.pendingAction?.id, 'pending-1');
  assert.deepEqual(pendingPayload, {
    description: 'Coffee',
    value: 42,
    date: '2026-07-11',
    type: 'EXPENSE',
    categoryId: 'category-1',
  });
}

async function testConfirmPendingActionCreatesTransactionOnce(): Promise<void> {
  let createTransactionCalls = 0;
  let confirmedActionId = '';
  const pendingAction = createPendingAction({
    id: 'pending-1',
    payload: {
      description: 'Coffee',
      value: 42,
      date: '2026-07-11',
      type: 'EXPENSE',
      categoryId: 'category-1',
    },
  });

  const registry = createRegistry({
    transactionService: {
      getTransactions: async () => [],
      getTransactionsSummary: async () => ({ totalIncome: 0, totalExpense: 0 }),
      createTransaction: async (data: any) => {
        createTransactionCalls++;
        assert.equal(data.userId, 'user-1');
        return { id: 'transaction-1' };
      },
    },
    agentRepository: {
      createPendingAction: async () => pendingAction,
      getPendingAction: async () => pendingAction,
      markPendingActionConfirmed: async (pendingActionId) => {
        confirmedActionId = pendingActionId;
      },
    },
  });

  const result = await registry.confirmPendingAction('pending-1', 'user-1');

  assert.equal(result.transactionId, 'transaction-1');
  assert.equal(createTransactionCalls, 1);
  assert.equal(confirmedActionId, 'pending-1');
}

function createRegistry(
  overrides: Partial<ConstructorParameters<typeof AgentToolRegistry>[0]> = {},
): AgentToolRegistry {
  return new AgentToolRegistry({
    transactionService: {
      getTransactions: async () => [],
      getTransactionsSummary: async () => ({ totalIncome: 0, totalExpense: 0 }),
      createTransaction: async () => ({ id: 'transaction-1' }),
    },
    categoryRepository: {
      getAllCategories: async () => [{ id: 'category-1', name: 'Restaurants' }],
    },
    agentRepository: {
      createPendingAction: async (_conversationId, _userId, _type, payload) =>
        createPendingAction({
          id: 'pending-1',
          payload: payload as CreateTransactionPendingActionPayload,
        }),
      getPendingAction: async () => null,
      markPendingActionConfirmed: async () => undefined,
    },
    ...overrides,
  });
}

function createPendingAction(params: {
  id: string;
  payload: CreateTransactionPendingActionPayload;
  status?: AgentPendingActionStatus;
}): AgentPendingAction {
  return {
    id: params.id,
    conversationId: 'conversation-1',
    userId: 'user-1',
    type: 'CREATE_TRANSACTION',
    status: params.status || 'PENDING',
    payload: params.payload,
    createdAt: new Date('2026-07-11T00:00:00.000Z'),
    updatedAt: new Date('2026-07-11T00:00:00.000Z'),
    confirmedAt: null,
    resultTransactionId: null,
  };
}

async function main(): Promise<void> {
  await testSearchTransactionsUsesAuthenticatedUserId();
  await testCreateTransactionToolCreatesPendingActionOnly();
  await testConfirmPendingActionCreatesTransactionOnce();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
