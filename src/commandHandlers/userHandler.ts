import { telegramService } from '../services/telegramService';
import { transactionManager } from '../services/transactionManager';

export class UserHandler {
  constructor() {}

  async handleStart(chatId: number) {
    transactionManager.resetUserState(chatId);
    return telegramService.sendMessage(
      chatId,
      '🎉 Welcome to the transaction bot!\nUse /help for available commands.',
    );
  }

  async handleHelp(chatId: number) {
    transactionManager.resetUserState(chatId);
    return telegramService.sendMessage(
      chatId,
      `📜 *Available Commands:*
      1. /create
      2. /list <days>
      3. /summary <days>
      4. /categories
      5. /search <keyword>
      6. /insights`,
    );
  }

  async handleReset(chatId: number) {
    transactionManager.resetUserState(chatId);
    return telegramService.sendMessage(chatId, '🔄 State has been reset.');
  }

  async handleUserState(chatId: number, text: string) {
    const { message, nextStep } = await transactionManager.handleUserState(
      chatId,
      text,
    );
    return telegramService.sendMessage(chatId, message);
  }
}

export const userHandler = new UserHandler();
