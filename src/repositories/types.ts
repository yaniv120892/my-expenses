import { TransactionType } from 'types/transaction';

export interface CreateTransactionDbModel {
  description: string;
  value: number;
  categoryId: string;
  type: TransactionType;
  date: Date;
}

export interface UpdateTransactionDbModel {
  description?: string;
  value?: number;
  categoryId?: string;
  type?: TransactionType;
  date?: Date;
}
