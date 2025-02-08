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
        await transactionHandler.handleList(chatId, args);
        return userHandler.handleHelp(chatId);
      case '/create':
        return transactionHandler.handleCreate(chatId);
      case '/summary':
        await transactionHandler.handleSummary(chatId, args);
        return userHandler.handleHelp(chatId);
      case '/search':
        await transactionHandler.handleSearch(chatId, args);
        return userHandler.handleHelp(chatId);
      case '/insights':
        await insightsHandler.handleInsights(chatId);
      case '/categories':
        await categoryHandler.handleList(chatId);
        return userHandler.handleHelp(chatId);
      default:
        return userHandler.handleUserState(chatId, command);
    }
  }
}

export const commandHandler = new CommandHandler();
