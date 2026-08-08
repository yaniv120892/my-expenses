import { getFinancialAssistant } from './assistant/financialAssistant';
import { getThreadId, isMemoryEnabled } from './assistant/memory';
import { USER_ID_CONTEXT_KEY } from './assistant/tools';
import { loadMastra } from './assistant/esm';

export interface ChatMessage {
  sender: string;
  text: string;
}

/**
 * The minimal message shape this service produces. Named to be obviously local
 * rather than the library's own message type, which is far wider.
 */
type OutgoingMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

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
    const [{ RequestContext }, assistant] = await Promise.all([
      loadMastra(),
      getFinancialAssistant(),
    ]);

    // Injected server-side so the model cannot choose whose data it reads.
    const requestContext = new RequestContext();
    requestContext.set(USER_ID_CONTEXT_KEY, userId);

    const result = await assistant.stream(this.toModelMessages(messages), {
      memory: {
        thread: getThreadId(userId),
        resource: userId,
      },
      requestContext,
      ...(abortSignal ? { abortSignal } : {}),
    });

    return result.textStream;
  }

  /**
   * The client posts its full message list, but the thread already holds the
   * earlier turns. Sending everything again would append duplicates on each
   * request, so only the newest message is passed through when memory is
   * active; without memory the whole conversation is the only context there is.
   */
  private toModelMessages(messages: ChatMessage[]): OutgoingMessage[] {
    const selected = isMemoryEnabled() ? messages.slice(-1) : messages;

    return selected.map((message) =>
      message.sender === 'user'
        ? { role: 'user' as const, content: message.text }
        : { role: 'assistant' as const, content: message.text },
    );
  }
}

export default new ChatService();
