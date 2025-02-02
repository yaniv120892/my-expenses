import { ChatGPTService } from './chatGPTService';
import { GeminiService } from './geminiService';
import { AIProvider } from './aiProvider';

class AIServiceFactory {
  static getAIService(): AIProvider {
    const aiProvider = process.env.AI_PROVIDER?.toLowerCase();

    switch (aiProvider) {
      case 'gemini':
        return new GeminiService();
      case 'chatgpt':
      default:
        return new ChatGPTService();
    }
  }
}

export default AIServiceFactory;
