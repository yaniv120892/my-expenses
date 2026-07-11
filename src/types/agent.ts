import {
  Transaction,
  TransactionSummary,
  TransactionType,
} from './transaction';

export type AgentMessageSender = 'USER' | 'ASSISTANT' | 'TOOL';

export type AgentToolCallStatus = 'SUCCESS' | 'FAILED';

export type AgentPendingActionType = 'CREATE_TRANSACTION';

export type AgentPendingActionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type AgentToolName =
  | 'search_transactions'
  | 'get_transaction_summary'
  | 'list_categories'
  | 'create_transaction_draft';

export interface AgentMessage {
  id: string;
  conversationId: string;
  sender: AgentMessageSender;
  content: string;
  createdAt: Date;
}

export interface AgentConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: AgentMessage[];
}

export interface CreateTransactionPendingActionPayload {
  description: string;
  value: number;
  date: string;
  type: TransactionType;
  categoryId: string;
}

export type AgentPendingActionPayload = CreateTransactionPendingActionPayload;

export interface AgentPendingAction {
  id: string;
  conversationId: string;
  userId: string;
  type: AgentPendingActionType;
  status: AgentPendingActionStatus;
  payload: AgentPendingActionPayload;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  resultTransactionId: string | null;
}

export interface AgentToolCall {
  id: string;
  conversationId: string;
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: AgentToolCallStatus;
  error: string | null;
  createdAt: Date;
}

export interface AgentToolExecutionRequest {
  conversationId: string;
  userId: string;
  name: AgentToolName;
  arguments: Record<string, unknown>;
}

export interface AgentToolResult {
  summary: string;
  data: Record<string, unknown>;
  pendingAction?: AgentPendingAction;
}

export interface AgentModelToolCall {
  id: string;
  name: AgentToolName;
  arguments: Record<string, unknown>;
}

export interface AgentModelResponse {
  content: string;
  toolCalls: AgentModelToolCall[];
}

export interface AgentRuntimeMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface AgentModelClient {
  createResponse(messages: AgentRuntimeMessage[]): Promise<AgentModelResponse>;
}

export interface SendAgentMessageRequest {
  conversationId?: string;
  message: string;
}

export interface SendAgentMessageResponse {
  conversationId: string;
  message: AgentMessage;
  toolCalls: AgentToolCall[];
  pendingAction: AgentPendingAction | null;
}

export interface ConfirmAgentPendingActionResponse {
  pendingActionId: string;
  transactionId: string;
}

export interface SearchTransactionsToolData {
  transactions: Transaction[];
}

export interface TransactionSummaryToolData {
  summary: TransactionSummary;
}
