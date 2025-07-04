import chatService from '../services/chatService';
import logger from '../utils/logger';

class ChatController {
  public handleChatMessage = async (messages: { sender: string; text: string }[], userId: string): Promise<string> => {
    try {
      logger.debug('Start handle chat message', { messages, userId });
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new Error('At least one message is required.');
      }

      const response = await chatService.getChatResponse(messages, userId);
      logger.debug('Done handle chat message', { response });
      return response;
    } catch (error) {
      logger.error('Failed to handle chat message', { error });
      throw error;
    }
  };
}

export default new ChatController();
