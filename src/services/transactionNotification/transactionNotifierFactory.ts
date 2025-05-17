import {
  TransactionNotifierType,
  TransactionNotifier,
} from './transactionNotifier';
import { TelegramTransactionNotifier } from './telegramTransactionNotifier';

class TransactionNotifierFactory {
  static getNotifier(): TransactionNotifier {
    const notifierType =
      process.env.TRANSACTION_CREATED_NOTIFIER_TYPE ||
      TransactionNotifierType.TELEGRAM;
    switch (notifierType) {
      case TransactionNotifierType.TELEGRAM:
      default:
        return new TelegramTransactionNotifier();
    }
  }
}

export default TransactionNotifierFactory;
