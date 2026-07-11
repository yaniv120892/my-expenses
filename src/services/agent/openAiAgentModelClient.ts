import OpenAI from 'openai';
import {
  AgentModelClient,
  AgentModelResponse,
  AgentRuntimeMessage,
  AgentToolName,
} from '../../types/agent';

type ChatMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type ChatTool = OpenAI.Chat.Completions.ChatCompletionTool;

export class OpenAiAgentModelClient implements AgentModelClient {
  private readonly openai: OpenAI;
  private readonly model: string;

  public constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.AGENT_MODEL || 'gpt-4o-mini';
  }

  public async createResponse(
    messages: AgentRuntimeMessage[],
  ): Promise<AgentModelResponse> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for agent responses.');
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: messages.map((message) => this.mapMessage(message)),
      tools: this.getTools(),
      tool_choice: 'auto',
      temperature: 0.2,
    });

    const message = response.choices[0]?.message;

    return {
      content: message?.content || '',
      toolCalls:
        message?.tool_calls?.map((toolCall) => ({
          id: toolCall.id,
          name: toolCall.function.name as AgentToolName,
          arguments: this.parseArguments(toolCall.function.arguments),
        })) || [],
    };
  }

  private mapMessage(message: AgentRuntimeMessage): ChatMessageParam {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.toolCallId || 'tool-call',
        content: message.content,
      };
    }

    return {
      role: message.role,
      content: message.content,
    };
  }

  private parseArguments(rawArguments: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(rawArguments) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }

    return {};
  }

  private getTools(): ChatTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'search_transactions',
          description:
            'Search the authenticated user transactions. Never include or infer userId.',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
              startDate: { type: 'string', description: 'YYYY-MM-DD' },
              endDate: { type: 'string', description: 'YYYY-MM-DD' },
              categoryId: { type: 'string' },
              transactionType: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
              searchTerm: { type: 'string' },
              page: { type: 'number' },
              perPage: { type: 'number' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_transaction_summary',
          description:
            'Get deterministic income and expense totals for the authenticated user.',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
              startDate: { type: 'string', description: 'YYYY-MM-DD' },
              endDate: { type: 'string', description: 'YYYY-MM-DD' },
              categoryId: { type: 'string' },
              transactionType: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_categories',
          description: 'List valid transaction categories.',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_transaction_draft',
          description:
            'Create a pending transaction draft. This does not write a transaction until the user confirms it.',
          parameters: {
            type: 'object',
            additionalProperties: false,
            required: ['description', 'value', 'date', 'type'],
            properties: {
              description: { type: 'string' },
              value: { type: 'number' },
              date: { type: 'string', description: 'YYYY-MM-DD' },
              type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
              categoryId: { type: 'string' },
              categoryName: { type: 'string' },
            },
          },
        },
      },
    ];
  }
}
