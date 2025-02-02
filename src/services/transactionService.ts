import aiServiceFactory from 'services/ai/aiServiceFactory';
import TransactionRepository from '..//repositories/transactionRepository';
import {
  CreateTransaction,
  TransactionFilters,
  Transaction,
  TransactionItem,
  TransactionSummaryFilters,
  TransactionSummary,
} from '..//types/transaction';
import createTransactionValidator from '..//validators/createTransactionValidator';
import categoryRepository from 'repositories/categoryRepository';

class TransactionService {
  private aiService = aiServiceFactory.getAIService();

  public async createTransaction(data: CreateTransaction): Promise<string> {
    const createTransaction = await this.updateCategory(data);
    await createTransactionValidator.validate(createTransaction);
    const CreateTransactionDbModel = {
      description: createTransaction.description,
      value: createTransaction.value,
      date: createTransaction.date || new Date(),
      categoryId: createTransaction.categoryId as string,
      type: createTransaction.type,
    };
    return TransactionRepository.createTransaction(CreateTransactionDbModel);
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

  public async deleteTransaction(transactionId: string): Promise<void> {
    return TransactionRepository.deleteTransaction(transactionId);
  }

  private async updateCategory(
    transaction: CreateTransaction,
  ): Promise<CreateTransaction> {
    if (transaction.categoryId) {
      return transaction;
    }

    const categories = await categoryRepository.getAllCategories();

    const suggestedCategoryId = await this.aiService.suggestCategory(
      transaction.description,
      categories,
    );

    return {
      ...transaction,
      categoryId: suggestedCategoryId,
    };
  }
}

export default new TransactionService();
