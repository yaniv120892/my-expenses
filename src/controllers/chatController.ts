import { Request, Response } from 'express';
import chatService, { ChatMessage } from '../services/chatService';
import logger from '../utils/logger';

class ChatController {
  /**
   * Streams the assistant's reply as Server-Sent Events.
   *
   * This writes to the response directly instead of going through
   * handleRequest(), which always terminates with res.json() and cannot stream.
   */
  public handleChatMessage = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const messages: ChatMessage[] = req.body?.messages;
    const userId = req.userId ?? '';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'At least one message is required.' });
      return;
    }

    logger.debug('Start handle chat message', { userId });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stop the agent when the client disconnects, so closing the chat dialog
    // does not leave a model run and its tool calls going.
    //
    // The 'error' listeners are not optional. A client that vanishes abruptly
    // (connection reset rather than a clean close) makes the request emit
    // 'error', and an unhandled 'error' event on an EventEmitter is thrown —
    // which would take the whole process down. Streaming responses are exactly
    // where that happens, since long-lived connections get dropped mid-flight.
    const controller = new AbortController();
    const stop = () => controller.abort();

    req.on('close', stop);
    req.on('error', stop);
    res.on('error', stop);

    try {
      const textStream = await chatService.streamChatResponse(
        messages,
        userId,
        controller.signal,
      );

      for await (const delta of textStream) {
        this.send(res, { type: 'delta', value: delta });
      }

      this.send(res, { type: 'done' });
      logger.debug('Done handle chat message', { userId });
    } catch (error) {
      logger.error('Failed to handle chat message', { error });

      // Headers are already sent, so the error middleware cannot set a status
      // code here — the failure has to travel as a stream event instead.
      this.send(res, {
        type: 'error',
        message:
          "I'm sorry, something went wrong while I was trying to answer that. Please try again.",
      });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };

  /**
   * Writes one SSE frame, skipping the write once the client has gone. Writing
   * to a closed response throws, and here that would surface inside the stream
   * loop after the reader has already disconnected.
   */
  private send(res: Response, payload: Record<string, unknown>): void {
    if (res.writableEnded || res.destroyed) {
      return;
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

export default new ChatController();
