import {
  AgentConversation,
  AgentMessage,
  AgentMessageSender,
  AgentPendingAction,
  AgentPendingActionPayload,
  AgentPendingActionType,
  AgentToolCall,
  AgentToolCallStatus,
} from '../types/agent';
import prisma from '../prisma/client';

class AgentRepository {
  public async getOrCreateConversation(
    conversationId: string | undefined,
    userId: string,
  ): Promise<AgentConversation> {
    if (conversationId) {
      const existing = await prisma.agentConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!existing) {
        throw new Error('Agent conversation not found.');
      }

      return this.mapConversation(existing);
    }

    const conversation = await prisma.agentConversation.create({
      data: { userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return this.mapConversation(conversation);
  }

  public async addMessage(
    conversationId: string,
    sender: AgentMessageSender,
    content: string,
  ): Promise<AgentMessage> {
    const message = await prisma.agentMessage.create({
      data: { conversationId, sender, content },
    });

    return this.mapMessage(message);
  }

  public async recordToolCall(params: {
    conversationId: string;
    name: string;
    args: Record<string, unknown>;
    result: Record<string, unknown> | null;
    status: AgentToolCallStatus;
    error?: string;
  }): Promise<AgentToolCall> {
    const toolCall = await prisma.agentToolCall.create({
      data: {
        conversationId: params.conversationId,
        name: params.name,
        args: params.args,
        status: params.status,
        error: params.error,
        ...(params.result ? { result: params.result } : {}),
      },
    });

    return this.mapToolCall(toolCall);
  }

  public async createPendingAction(
    conversationId: string,
    userId: string,
    type: AgentPendingActionType,
    payload: AgentPendingActionPayload,
  ): Promise<AgentPendingAction> {
    const pendingAction = await prisma.agentPendingAction.create({
      data: { conversationId, userId, type, payload },
    });

    return this.mapPendingAction(pendingAction);
  }

  public async getPendingAction(
    pendingActionId: string,
    userId: string,
  ): Promise<AgentPendingAction | null> {
    const pendingAction = await prisma.agentPendingAction.findFirst({
      where: { id: pendingActionId, userId },
    });

    return pendingAction ? this.mapPendingAction(pendingAction) : null;
  }

  public async markPendingActionConfirmed(
    pendingActionId: string,
    transactionId: string,
  ): Promise<void> {
    await prisma.agentPendingAction.update({
      where: { id: pendingActionId },
      data: {
        status: 'CONFIRMED',
        resultTransactionId: transactionId,
        confirmedAt: new Date(),
      },
    });
  }

  private mapConversation(conversation: {
    id: string;
    userId: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    messages: {
      id: string;
      conversationId: string;
      sender: AgentMessageSender;
      content: string;
      createdAt: Date;
    }[];
  }): AgentConversation {
    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((message) =>
        this.mapMessage(message),
      ),
    };
  }

  private mapMessage(message: {
    id: string;
    conversationId: string;
    sender: AgentMessageSender;
    content: string;
    createdAt: Date;
  }): AgentMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  private mapToolCall(toolCall: {
    id: string;
    conversationId: string;
    name: string;
    args: unknown;
    result: unknown;
    status: AgentToolCallStatus;
    error: string | null;
    createdAt: Date;
  }): AgentToolCall {
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

  private mapPendingAction(pendingAction: {
    id: string;
    conversationId: string;
    userId: string;
    type: AgentPendingActionType;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    payload: unknown;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt: Date | null;
    resultTransactionId: string | null;
  }): AgentPendingAction {
    return {
      id: pendingAction.id,
      conversationId: pendingAction.conversationId,
      userId: pendingAction.userId,
      type: pendingAction.type,
      status: pendingAction.status,
      payload: pendingAction.payload as AgentPendingActionPayload,
      createdAt: pendingAction.createdAt,
      updatedAt: pendingAction.updatedAt,
      confirmedAt: pendingAction.confirmedAt,
      resultTransactionId: pendingAction.resultTransactionId,
    };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

export default new AgentRepository();
export { AgentRepository };
