import aiServiceFactory from './ai/aiServiceFactory';
import transactionRepository from '../repositories/transactionRepository';
import {
  CreateTransaction,
  TransactionFilters,
  Transaction,
  TransactionItem,
  TransactionSummaryFilters,
  TransactionSummary,
} from '../types/transaction';
import {
  CreateTransactionRequest,
  GetTransactionsRequest,
  GetTransactionsSummaryRequest,
} from '../controllers/requests';
import createTransactionValidator from '../validators/createTransactionValidator';
import categoryRepository from '../repositories/categoryRepository';
import axios from 'axios';
import logger from '../utils/logger';
import { Category } from '../types/category';
import { log } from 'winston';

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
    return transactionRepository.createTransaction(CreateTransactionDbModel);
  }

  public async getTransactions(
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    return transactionRepository.getTransactions(filters);
  }

  public async getTransactionItem(
    data: TransactionItem,
  ): Promise<Transaction | null> {
    return transactionRepository.getTransactionItem(data);
  }

  public async getTransactionsSummary(
    filters: TransactionSummaryFilters,
  ): Promise<TransactionSummary> {
    return transactionRepository.getTransactionsSummary(filters);
  }

  public async updateTransaction(
    id: string,
    data: CreateTransactionRequest,
  ): Promise<void> {
    await transactionRepository.updateTransaction(id, data);
  }

  public async deleteTransaction(id: string): Promise<void> {
    return transactionRepository.deleteTransaction(id);
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
}

export default new TransactionService();
