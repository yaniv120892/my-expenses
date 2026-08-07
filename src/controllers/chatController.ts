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
    const controller = new AbortController();
    req.on('close', () => controller.abort());

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
      res.end();
    }
  };

  private send(res: Response, payload: Record<string, unknown>): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

export default new ChatController();
