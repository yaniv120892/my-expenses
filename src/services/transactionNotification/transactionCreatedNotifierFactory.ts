import {
  TransactionCreatedNotifierType,
  TransactionCreatedNotifier,
} from './transactionCreatedNotifier';
import { TelegramTransactionCreatedNotifier } from './telegramTransactionCreatedNotifier';

class TransactionCreatedNotifierFactory {
  static getNotifier(): TransactionCreatedNotifier {
    const notifierType =
      process.env.TRANSACTION_CREATED_NOTIFIER_TYPE ||
      TransactionCreatedNotifierType.TELEGRAM;
    switch (notifierType) {
      case TransactionCreatedNotifierType.TELEGRAM:
      default:
        return new TelegramTransactionCreatedNotifier();
    }
  }
}

export default TransactionCreatedNotifierFactory;
