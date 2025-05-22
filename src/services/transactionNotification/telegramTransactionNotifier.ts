import { TransactionNotifier } from './transactionNotifier';
import { Transaction } from '../../types/transaction';
import { telegramService } from '../telegramService';
import { formatTransaction } from '../../utils/transactionUtils';
import logger from '../../utils/logger';
import userSettingsService from '../userSettingsService';

export class TelegramTransactionNotifier implements TransactionNotifier {
  public async notifyTransactionCreated(
    transaction: Transaction,
    userId: string,
  ): Promise<void> {
    try {
      logger.debug(
        'Start sending transaction notification to Telegram',
        userId,
        transaction.id,
      );
      const chatId = await this.getChatId(userId);
      if (!chatId) {
        logger.warn(
          'skipping transaction notification. Telegram chat ID is not set or user has disabled notifications',
          userId,
          transaction.id,
        );
        return;
      }
      const message = `Transaction Created\n${formatTransaction(transaction)}`;
      await telegramService.sendMessage(Number(chatId), message);
      logger.debug(
        'Done sending transaction notification to Telegram',
        userId,
        transaction.id,
      );
    } catch (error) {
      logger.error(
        'Failed to send transaction notification',
        userId,
        transaction.id,
      );
      throw new Error(
        `Failed to send transaction notification, userId: ${userId} transactionId: ${transaction.id} error: ${JSON.stringify(
          error,
        )}`,
      );
    }
  }

  public async sendDailySummary(
    dailySummary: string,
    userId: string,
  ): Promise<void> {
    try {
      logger.debug('Start sending daily summary to Telegram', userId);
      const chatId = await this.getChatId(userId);
      if (!chatId) {
        logger.warn(
          'Skip sending daily summary, Telegram chat ID is not set or user has disabled notifications',
          userId,
        );
        return;
      }
      await telegramService.sendMessage(Number(chatId), dailySummary);
      logger.debug('Done sending daily summary to Telegram', userId);
    } catch (error) {
      logger.error('Failed to send daily summary', userId, error);
      throw new Error(
        `Failed to send daily summary, userId: ${userId} error: ${JSON.stringify(error)}`,
      );
    }
  }

  private async getChatId(userId: string) {
    const userChatId = await userSettingsService.getUserSettings(userId);
    return userChatId?.provider?.enabled
      ? userChatId.provider.telegramChatId
      : null;
  }
}
