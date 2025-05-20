import { Transaction } from 'types/transaction';

export enum TransactionNotifierType {
  TELEGRAM = 'TELEGRAM',
}

export interface TransactionNotifier {
  notifyTransactionCreated(transaction: Transaction): Promise<void>;
  sendDailySummary(dailySummary: string, userId: string): Promise<void>;
}
