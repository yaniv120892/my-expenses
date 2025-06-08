import { TransactionStatus, TransactionType } from './transaction';

export enum ImportFileType {
  VISA_CREDIT = 'VISA_CREDIT',
  MASTERCARD_CREDIT = 'MASTERCARD_CREDIT',
  AMERICAN_EXPRESS_CREDIT = 'AMERICAN_EXPRESS_CREDIT',
}

export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Import {
  id: string;
  userId: string;
  fileUrl: string;
  importType: ImportFileType;
  status: ImportStatus;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ImportedTransaction {
  id: string;
  importId: string;
  description: string;
  value: number;
  date: Date;
  type: TransactionType;
  status: TransactionStatus;
  matchingTransactionId?: string;
  rawData: any;
  userId: string;
}

export interface ImportQueueMessage {
  importId: string;
  fileUrl: string;
  importType: ImportFileType;
  userId: string;
}
