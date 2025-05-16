import { TransactionCreatedNotifier } from './transactionCreatedNotifier';
import { Transaction } from '../../types/transaction';
import { telegramService } from '../telegramService';
import { formatTransaction } from '../../utils/transactionUtils';
import logger from '../../utils/logger';

export class TelegramTransactionCreatedNotifier
  implements TransactionCreatedNotifier
{
  async notifyTransactionCreated(transaction: Transaction): Promise<void> {
    const chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
    if (!chatId) {
      logger.warn('Telegram chat ID is not set. Skipping notification.');
      return;
    }

    const message = `Transaction Created\n${formatTransaction(transaction)}`;
    await telegramService.sendMessage(Number(chatId), message);
  }
}
