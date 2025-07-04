import chatService from '../services/chatService';
import logger from '../utils/logger';

class ChatController {
  public handleChatMessage = async (message: string, userId: string): Promise<string> => {
    try {
      logger.debug('Start handle chat message', { message, userId });
      if (!message) {
        throw new Error('A message is required.');
      }

      const response = await chatService.getChatResponse(message, userId);
      logger.debug('Done handle chat message', { response });
      return response;
    } catch (error) {
      logger.error('Failed to handle chat message', { error });
      throw error;
    }
  };
}

export default new ChatController();
