export interface CreateTransaction {
  description: string;
  value: number;
  categoryId: string | null;
  type: TransactionType;
  date: Date | null;
}

export interface TransactionSummaryFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  transactionType?: TransactionType;
  searchTerm?: string;
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
