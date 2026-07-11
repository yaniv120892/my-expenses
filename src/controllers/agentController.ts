import {
  ConfirmAgentPendingActionResponse,
  SendAgentMessageRequest,
  SendAgentMessageResponse,
} from '../types/agent';
import { AgentService } from '../services/agent/agentService';
import { AgentToolRegistry } from '../services/agent/agentToolRegistry';
import logger from '../utils/logger';

class AgentController {
  private readonly agentService: AgentService;
  private readonly agentToolRegistry: AgentToolRegistry;

  public constructor() {
    this.agentService = new AgentService();
    this.agentToolRegistry = new AgentToolRegistry();
  }

  public async sendMessage(
    request: SendAgentMessageRequest,
    userId: string,
  ): Promise<SendAgentMessageResponse> {
    logger.debug('Start agent message', {
      conversationId: request.conversationId,
      userId,
    });

    const response = await this.agentService.sendMessage(request, userId);

    logger.debug('Done agent message', {
      conversationId: response.conversationId,
      toolCallCount: response.toolCalls.length,
      pendingActionId: response.pendingAction?.id,
    });

    return response;
  }

  public async confirmPendingAction(
    pendingActionId: string,
    userId: string,
  ): Promise<ConfirmAgentPendingActionResponse> {
    logger.debug('Start confirm agent pending action', {
      pendingActionId,
      userId,
    });

    const result = await this.agentToolRegistry.confirmPendingAction(
      pendingActionId,
      userId,
    );

    logger.debug('Done confirm agent pending action', {
      pendingActionId,
      transactionId: result.transactionId,
    });

    return {
      pendingActionId,
      transactionId: result.transactionId,
    };
  }
}

export default new AgentController();
