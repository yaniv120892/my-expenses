import aiServiceFactory from './ai/aiServiceFactory';
import transactionRepository from '../repositories/transactionRepository';
import {
  CreateTransaction,
  TransactionFilters,
  Transaction,
  TransactionItem,
  TransactionSummaryFilters,
  TransactionSummary,
  TransactionStatus,
} from '../types/transaction';
import { CreateTransactionRequest } from '../controllers/requests';
import createTransactionValidator from '../validators/createTransactionValidator';
import categoryRepository from '../repositories/categoryRepository';
import axios from 'axios';
import logger from '../utils/logger';
import { Category } from '../types/category';
import TransactionNotifierFactory from './transactionNotification/transactionNotifierFactory';
import userSettingsService from '../services/userSettingsService';

class TransactionService {
  private aiService = aiServiceFactory.getAIService();
  private transactionNotifier = TransactionNotifierFactory.getNotifier();

  public async createTransaction(data: CreateTransaction): Promise<string> {
    const createTransaction = await this.updateCategory(data);
    await createTransactionValidator.validate(createTransaction);
    const CreateTransactionDbModel = {
      description: createTransaction.description,
      value: createTransaction.value,
      date: createTransaction.date || new Date(),
      categoryId: createTransaction.categoryId as string,
      type: createTransaction.type,
      status: createTransaction.status || 'APPROVED',
      userId: createTransaction.userId,
    };
    const transactionId = await transactionRepository.createTransaction(
      CreateTransactionDbModel,
    );

    await this.notifyTransactionCreatedSafe(
      transactionId,
      createTransaction.userId,
    );

    return transactionId;
  }

  public async getTransactions(
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    return transactionRepository.getTransactions({
      ...filters,
      status: filters.status || 'APPROVED',
    });
  }

  public async getAllTransactions(
    filters: TransactionSummaryFilters,
  ): Promise<Transaction[]> {
    const transactions = [];

    let hasMoreTransactions = true;
    let page = 1;
    const perPage = 100;
    while (hasMoreTransactions) {
      const transactionsPage = await this.getTransactions({
        ...filters,
        page,
        perPage,
      });
      transactions.push(...transactionsPage);
      if (transactionsPage.length < perPage) {
        hasMoreTransactions = false;
      }
      page++;
    }

    return transactions;
  }

  public async getPendingTransactions(userId: string): Promise<Transaction[]> {
    return transactionRepository.getPendingTransactions(userId);
  }

  public async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    userId: string,
  ): Promise<string> {
    const transactionId = await transactionRepository.updateTransactionStatus(
      id,
      status,
      userId,
    );
    if (status === 'APPROVED') {
      await this.notifyTransactionCreatedSafe(transactionId, userId);
    }

    return transactionId;
  }

  public async getTransactionItem(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | null> {
    return transactionRepository.getTransactionItem(transactionId, userId);
  }

  public async getTransactionsSummary(
    filters: TransactionSummaryFilters,
  ): Promise<TransactionSummary> {
    return transactionRepository.getTransactionsSummary({
      ...filters,
      status: filters.status || 'APPROVED',
    });
  }

  public async updateTransaction(
    id: string,
    data: CreateTransactionRequest,
    userId: string,
  ): Promise<void> {
    await transactionRepository.updateTransaction(id, data, userId);
  }

  public async deleteTransaction(id: string, userId: string): Promise<void> {
    return transactionRepository.deleteTransaction(id, userId);
  }

  private async updateCategory(
    transaction: CreateTransaction,
  ): Promise<CreateTransaction> {
    if (transaction.categoryId) {
      return transaction;
    }

    const categories = await categoryRepository.getAllCategories();

    const suggestedCategoryId = await this.getSuggestedCategory(
      transaction.description,
      categories,
    );

    return {
      ...transaction,
      categoryId: suggestedCategoryId,
    };
  }

  private async getSuggestedCategory(
    description: string,
    categories: Category[],
  ): Promise<string> {
    let categoryFoundUsingCategorizer = false;
    let category: string | null = null;
    try {
      category = await this.categorizeExpense(description);

      if (category && categories.find((c) => c.name === category)) {
        categoryFoundUsingCategorizer = true;
      }
    } catch (err) {
      logger.warn(`Failed to categorize expense: ${description}`);
    }

    if (categoryFoundUsingCategorizer) {
      logger.debug(
        `Categorizer found category for expense: ${description} - ${category}`,
      );
      return categories.find((c) => c.name === category)?.id as string;
    }

    logger.warn(
      `No category found for expense using categorizer. Using AI service instead.`,
    );

    return this.aiService.suggestCategory(description, categories);
  }

  private async categorizeExpense(description: string): Promise<string | null> {
    const expenseCategorizerBaseUrl = process.env.EXPENSE_CATEGORIZER_BASE_URL;
    const response = await axios.post(`${expenseCategorizerBaseUrl}/predict`, {
      description,
    });
    logger.debug(`Done categorizing expense: ${description}`);

    if (!response.data.category) {
      logger.error('No category found for expense using categorizer.');
      return null;
    }

    return response.data.category;
  }

  private async notifyTransactionCreatedSafe(
    transactionId: string,
    userId: string,
  ) {
    try {
      const transaction = await this.getTransactionItem(transactionId, userId);
      if (!transaction) {
        logger.warn(
          `skipped notification for transaction ${transactionId} - transaction not found`,
        );
        return;
      }

      if (transaction.status !== 'APPROVED') {
        logger.debug(
          `skipped notification for transaction ${transactionId} - transaction not approved`,
        );
        return;
      }

      const isNotificationEnabled =
        await userSettingsService.isCreateTransactionNotificationEnabled(
          userId,
        );
      if (!isNotificationEnabled) {
        logger.debug(
          `skipped notification for transaction ${transactionId} - notification not enabled for user ${userId}`,
        );
        return;
      }

      await this.transactionNotifier.notifyTransactionCreated(
        transaction,
        userId,
      );
    } catch (error) {
      logger.error(
        `Failed to notify transaction created: ${transactionId} - ${error}`,
      );
    }
  }
}

export default new TransactionService();
