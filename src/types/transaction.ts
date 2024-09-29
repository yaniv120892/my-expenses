export interface CreateTransaction {
  description: string;
  value: number;
  categoryId: string;
  type: TransactionType;
}

export interface DeleteTransaction {
  id: string;
}

export interface TransactionSummaryFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  transactionType?: TransactionType;
}

export interface TransactionFilters extends TransactionSummaryFilters {
  page: number;
  perPage: number;
}

export interface TransactionItem {
  id: string;
}

export interface Transaction {
  id: string;
  description: string;
  value: number;
  date: Date;
  type: TransactionType;
  category: {
    id: string;
    name: string;
  };
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
