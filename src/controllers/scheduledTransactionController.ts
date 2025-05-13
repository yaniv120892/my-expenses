import logger from '../utils/logger';
import scheduledTransactionService from '../services/scheduledTransactionService';
import {
  CreateScheduledTransaction,
  UpdateScheduledTransaction,
  ScheduledTransactionDomain,
} from '../types/scheduledTransaction';

class ScheduledTransactionController {
  public async create(reqBody: CreateScheduledTransaction) {
    try {
      logger.debug('Start create scheduled transaction', reqBody);
      const result =
        await scheduledTransactionService.createScheduledTransaction(reqBody);
      logger.debug('Done create scheduled transaction', result);
      return result;
    } catch (error: any) {
      logger.error(
        `Failed to create scheduled transaction, ${JSON.stringify(reqBody)}, ${error.message}`,
      );
      throw error;
    }
  }

  public async update(id: string, reqBody: UpdateScheduledTransaction) {
    try {
      logger.debug('Start update scheduled transaction', { id, reqBody });
      const result =
        await scheduledTransactionService.updateScheduledTransaction(
          id,
          reqBody,
        );
      logger.debug('Done update scheduled transaction', result);
      return result;
    } catch (error: any) {
      logger.error(
        `Failed to update scheduled transaction ${id}, ${error.message}`,
      );
      throw error;
    }
  }

  public async list(): Promise<ScheduledTransactionDomain[]> {
    try {
      logger.debug('Start list scheduled transactions');
      const result =
        await scheduledTransactionService.listScheduledTransactions();
      logger.debug('Done list scheduled transactions', result);
      return result;
    } catch (error: any) {
      logger.error(`Failed to list scheduled transactions, ${error.message}`);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Start delete scheduled transaction', id);
      const result =
        await scheduledTransactionService.deleteScheduledTransaction(id);
      logger.debug('Done delete scheduled transaction', id);
      return result;
    } catch (error: any) {
      logger.error(
        `Failed to delete scheduled transaction ${id}, ${error.message}`,
      );
      throw error;
    }
  }
}

export default new ScheduledTransactionController();
