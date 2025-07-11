export type TransactionStatus = 'APPROVED' | 'PENDING_APPROVAL';

export interface TransactionFile {
  id: string;
  transactionId: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionFile {
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
}

export interface CreateTransaction {
  description: string;
  value: number;
  categoryId: string | null;
  type: TransactionType;
  date: Date | null;
  status?: TransactionStatus;
  userId: string;
  files?: CreateTransactionFile[];
}

export interface TransactionSummaryFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  transactionType?: TransactionType;
  searchTerm?: string;
  status?: TransactionStatus;
  userId: string;
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
  status: TransactionStatus;
  category: {
    id: string;
    name: string;
  };
  files?: TransactionFile[];
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
}

//TODO: remove this type and use enum instead
export type TransactionType = 'INCOME' | 'EXPENSE';
