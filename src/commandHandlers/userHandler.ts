import { telegramService } from '../services/telegramService';
import { transactionManager } from '../services/transactionManager';

export class UserHandler {
  constructor() {}

  async handleStart(chatId: string) {
    transactionManager.resetUserState(chatId);
    return telegramService.sendMessage(
      chatId,
      '🎉 Welcome to the transaction bot!\nUse /help for available commands.',
    );
  }

  async handleHelp(chatId: string) {
    transactionManager.resetUserState(chatId);
    return telegramService.sendMessage(
      chatId,
      `📜 *Available Commands:*
      1. /create
      2. /list <userId> <days>
      3. /summary <userId> <days>
      4. /categories
      5. /search <userId> <keyword>
      6. /insights <userId>`,
    );
  }

  async handleReset(chatId: string) {
    transactionManager.resetUserState(chatId);
    return telegramService.sendMessage(chatId, '🔄 State has been reset.');
  }

  async handleUserState(chatId: string, text: string) {
    const { message } = await transactionManager.handleUserState(chatId, text);
    return telegramService.sendMessage(chatId, message);
  }
}

export const userHandler = new UserHandler();
