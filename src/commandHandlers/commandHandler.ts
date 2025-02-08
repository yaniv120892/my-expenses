import { userHandler } from './userHandler';
import { transactionHandler } from './transactionHandler';
import { insightsHandler } from './insightHandler';
import { categoryHandler } from './categoryHandler';

class CommandHandler {
  async executeCommand(command: string, chatId: number, args: string[]) {
    switch (command) {
      case '/start':
        return userHandler.handleStart(chatId);
      case '/help':
        return userHandler.handleHelp(chatId);
      case '/reset':
        await userHandler.handleReset(chatId);
        return userHandler.handleHelp(chatId);
      case '/list':
        return transactionHandler.handleList(chatId, args);
      case '/create':
        return transactionHandler.handleCreate(chatId);
      case '/summary':
        return transactionHandler.handleSummary(chatId, args);
      case '/search':
        return transactionHandler.handleSearch(chatId, args);
      case '/insights':
        return insightsHandler.handleInsights(chatId);
      case '/categories':
        return categoryHandler.handleList(chatId);
      default:
        return userHandler.handleUserState(chatId, command);
    }
  }
}

export const commandHandler = new CommandHandler();
