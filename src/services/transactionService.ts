import TransactionRepository from '@app/repositories/transactionRepository';
import {
  CreateTransaction,
  TransactionFilters,
  Transaction,
  TransactionItem,
  TransactionSummaryFilters,
  TransactionSummary,
} from '@app/types/transaction';
import createTransactionValidator from '@app/validators/createTransactionValidator';

class TransactionService {
  public async createTransaction(data: CreateTransaction): Promise<string> {
    await createTransactionValidator.validate(data);
    return TransactionRepository.createTransaction(data);
  }

  public async getTransactions(
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    return TransactionRepository.getTransactions(filters);
  }

  public async getTransactionItem(
    data: TransactionItem,
  ): Promise<Transaction | null> {
    return TransactionRepository.getTransactionItem(data);
  }

  public async getTransactionsSummary(
    filters: TransactionSummaryFilters,
  ): Promise<TransactionSummary> {
    return TransactionRepository.getTransactionsSummary(filters);
  }
}

export default new TransactionService();
