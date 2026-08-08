"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const financialAssistant_1 = require("./assistant/financialAssistant");
const memory_1 = require("./assistant/memory");
const tools_1 = require("./assistant/tools");
const esm_1 = require("./assistant/esm");
class ChatService {
    /**
     * Runs the assistant and returns a stream of text deltas.
     *
     * The agent decides which tools to call and how many times, so questions that
     * need more than one lookup (comparisons, follow-ups) are answered in a single
     * turn. Figures always come from tool results, never from the model.
     */
    async streamChatResponse(messages, userId, abortSignal) {
        const [{ RequestContext }, assistant] = await Promise.all([
            (0, esm_1.loadMastra)(),
            (0, financialAssistant_1.getFinancialAssistant)(),
        ]);
        // Injected server-side so the model cannot choose whose data it reads.
        const requestContext = new RequestContext();
        requestContext.set(tools_1.USER_ID_CONTEXT_KEY, userId);
        const result = await assistant.stream(this.toModelMessages(messages), Object.assign({ memory: {
                thread: (0, memory_1.getThreadId)(userId),
                resource: userId,
            }, requestContext }, (abortSignal ? { abortSignal } : {})));
        return result.textStream;
    }
    /**
     * The client posts its full message list, but the thread already holds the
     * earlier turns. Sending everything again would append duplicates on each
     * request, so only the newest message is passed through when memory is
     * active; without memory the whole conversation is the only context there is.
     */
    toModelMessages(messages) {
        const selected = (0, memory_1.isMemoryEnabled)() ? messages.slice(-1) : messages;
        return selected.map((message) => message.sender === 'user'
            ? { role: 'user', content: message.text }
            : { role: 'assistant', content: message.text });
    }
}
exports.default = new ChatService();
