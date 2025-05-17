import { TransactionNotifier } from './transactionNotifier';
import { Transaction } from '../../types/transaction';
import { telegramService } from '../telegramService';
import { formatTransaction } from '../../utils/transactionUtils';
import logger from '../../utils/logger';

export class TelegramTransactionNotifier implements TransactionNotifier {
  public async notifyTransactionCreated(
    transaction: Transaction,
  ): Promise<void> {
    try {
      logger.debug(
        'Start sending transaction notification to Telegram for transaction:',
        JSON.stringify(transaction),
      );
      const chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
      if (!chatId) {
        logger.warn(
          'skipping transaction notification. Telegram chat ID is not set.',
        );
        return;
      }
      const message = `Transaction Created\n${formatTransaction(transaction)}`;
      await telegramService.sendMessage(Number(chatId), message);
      logger.debug(
        `Done sending transaction notification to Telegram, message: ${message}`,
      );
    } catch (error) {
      logger.error(
        `Failed to send transaction notification: ${JSON.stringify(transaction)}, error: ${JSON.stringify(error)}`,
      );
      throw new Error(
        `Failed to send transaction notification, ${JSON.stringify(transaction)}, error: ${JSON.stringify(error)}`,
      );
    }
  }

  public async sendDailySummary(dailySummary: string): Promise<void> {
    try {
      logger.debug(
        'Start sending daily summary to Telegram, message:',
        dailySummary,
      );
      const chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
      if (!chatId) {
        logger.warn('Telegram chat ID is not set. Skipping daily summary.');
        return;
      }
      await telegramService.sendMessage(Number(chatId), dailySummary);
      logger.debug(
        `Done sending daily summary to Telegram, message: ${dailySummary}`,
      );
    } catch (error) {
      logger.error(
        `Failed to send daily summary: ${dailySummary}, error: ${JSON.stringify(error)}`,
      );
      throw new Error(
        `Failed to send daily summary, ${dailySummary}, error: ${JSON.stringify(error)}`,
      );
    }
  }
}
