import { Transaction } from 'types/transaction';

export enum TransactionCreatedNotifierType {
  TELEGRAM = 'TELEGRAM',
}

export interface TransactionCreatedNotifier {
  notifyTransactionCreated(transaction: Transaction): Promise<void>;
}
