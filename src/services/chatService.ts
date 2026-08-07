import { RequestContext } from '@mastra/core/request-context';
import { financialAssistant } from './assistant/financialAssistant';
import { getThreadId, isMemoryEnabled } from './assistant/memory';
import { USER_ID_CONTEXT_KEY } from './assistant/tools';

export interface ChatMessage {
  sender: string;
  text: string;
}

class ChatService {
  /**
   * Runs the assistant and returns a stream of text deltas.
   *
   * The agent decides which tools to call and how many times, so questions that
   * need more than one lookup (comparisons, follow-ups) are answered in a single
   * turn. Figures always come from tool results, never from the model.
   */
  public async streamChatResponse(
    messages: ChatMessage[],
    userId: string,
    abortSignal?: AbortSignal,
  ): Promise<AsyncIterable<string>> {
    // Injected server-side so the model cannot choose whose data it reads.
    const requestContext = new RequestContext();
    requestContext.set(USER_ID_CONTEXT_KEY, userId);

    const result = await financialAssistant.stream(
      this.toModelMessages(messages),
      {
        memory: {
          thread: getThreadId(userId),
          resource: userId,
        },
        requestContext,
        ...(abortSignal ? { abortSignal } : {}),
      },
    );

    return result.textStream;
  }

  /**
   * The client posts its full message list, but the thread already holds the
   * earlier turns. Sending everything again would append duplicates on each
   * request, so only the newest user message is passed through when memory is
   * active; without memory the whole conversation is the only context there is.
   */
  private toModelMessages(messages: ChatMessage[]): ModelMessage[] {
    const history = isMemoryEnabled()
      ? messages.slice(-1).filter((message) => message.sender === 'user')
      : messages;

    // Fall back to the last message if the client's final entry was not a user
    // turn, so a request never arrives with nothing to answer.
    const selected = history.length ? history : messages.slice(-1);

    return selected.map((message) =>
      message.sender === 'user'
        ? { role: 'user' as const, content: message.text }
        : { role: 'assistant' as const, content: message.text },
    );
  }
}

type ModelMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

export default new ChatService();
