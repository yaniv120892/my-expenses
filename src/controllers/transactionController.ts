import logger from '../utils/logger';
import {
  CreateTransactionRequest,
  GetTransactionsRequest,
  GetTransactionsSummaryRequest,
  UpdateTransactionRequest,
} from '../controllers/requests';
import transactionService from '../services/transactionService';
import { TransactionStatus } from '../types/transaction';

class TransactionController {
  async createTransaction(
    createTransactionRequest: CreateTransactionRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start create transaction', createTransactionRequest);
      const transactionId = await transactionService.createTransaction({
        ...createTransactionRequest,
        date: createTransactionRequest.date || new Date(),
        categoryId: createTransactionRequest.categoryId || null,
        userId,
      });
      logger.debug(
        'Done create transaction',
        createTransactionRequest,
        transactionId,
      );
      return transactionId;
    } catch (error: any) {
      logger.error(
        `Failed to create transaction, ${JSON.stringify(createTransactionRequest)}, ${error.message}`,
      );
      throw error;
    }
  }

  async getTransactions(
    getTransactionsRequest: GetTransactionsRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start get transactions', getTransactionsRequest);
      const transactions = await transactionService.getTransactions({
        ...getTransactionsRequest,
        startDate: getTransactionsRequest.startDate
          ? new Date(getTransactionsRequest.startDate)
          : undefined,
        endDate: getTransactionsRequest.endDate
          ? new Date(getTransactionsRequest.endDate)
          : undefined,
        transactionType: getTransactionsRequest.type,
        userId,
        smartSearch:
          getTransactionsRequest.smartSearch !== undefined
            ? getTransactionsRequest.smartSearch
            : true,
      });
      logger.debug(
        'Done get transactions',
        getTransactionsRequest,
        transactions,
      );
      return transactions;
    } catch (error: any) {
      logger.error(`Failed to get transactions, ${error.message}`);
      throw error;
    }
  }

  async getSummary(
    getTransactionsRequest: GetTransactionsSummaryRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start get transactions summary', getTransactionsRequest);
      const summary = await transactionService.getTransactionsSummary({
        ...getTransactionsRequest,
        userId,
      });
      logger.debug(
        'Done get transactions summary',
        getTransactionsRequest,
        summary,
      );
      return summary;
    } catch (error: any) {
      logger.error(`Failed to get transactions summary, ${error.message}`);
      throw error;
    }
  }

  async updateTransaction(
    id: string,
    updateTransactionRequest: UpdateTransactionRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start update transaction', id, updateTransactionRequest);
      const transactionId = await transactionService.updateTransaction(
        id,
        updateTransactionRequest,
        userId,
      );
      logger.debug('Done update transaction', id, transactionId);
      return transactionId;
    } catch (error: any) {
      logger.error(`Failed to update transaction ${id}, ${error.message}`);
      throw error;
    }
  }

  async deleteTransaction(id: string, userId: string) {
    try {
      logger.debug('Start delete transaction', id);
      await transactionService.deleteTransaction(id, userId);
      logger.debug('Done delete transaction', id);
      return;
    } catch (error: any) {
      logger.error(`Failed to delete transaction ${id}, ${error.message}`);
      throw error;
    }
  }

  public async getPendingTransactions(userId: string) {
    try {
      logger.debug('Start get pending transactions');
      const transactions =
        await transactionService.getPendingTransactions(userId);
      logger.debug('Done get pending transactions', transactions);
      return transactions;
    } catch (error: any) {
      logger.error(`Failed to get pending transactions, ${error.message}`);
      throw error;
    }
  }

  public async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    userId: string,
  ) {
    try {
      logger.debug('Start update transaction status', { id, status });
      const transactionId = await transactionService.updateTransactionStatus(
        id,
        status,
        userId,
      );
      logger.debug('Done update transaction status', { id, status });
      return transactionId;
    } catch (error: any) {
      logger.error(
        `Failed to update transaction status for ${id}, ${error.message}`,
      );
      throw error;
    }
  }
}

export default new TransactionController();
