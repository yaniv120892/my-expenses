import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorUtils';
import scheduledTransactionService from '../services/scheduledTransactionService';
import { ScheduledTransactionDomain } from '../types/scheduledTransaction';
import {
  CreateScheduledTransactionRequest,
  UpdateScheduledTransactionRequest,
} from 'controllers/requests';

class ScheduledTransactionController {
  public async create(
    request: CreateScheduledTransactionRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start create scheduled transaction', request);
      const result =
        await scheduledTransactionService.createScheduledTransaction({
          ...request,
          userId,
        });
      logger.debug('Done create scheduled transaction', result);
      return result;
    } catch (error) {
      logger.error(
        `Failed to create scheduled transaction, ${JSON.stringify(request)}, ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  public async update(
    id: string,
    request: UpdateScheduledTransactionRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start update scheduled transaction', {
        id,
        reqBody: request,
      });
      const result =
        await scheduledTransactionService.updateScheduledTransaction(
          id,
          request,
          userId,
        );
      logger.debug('Done update scheduled transaction', result);
      return result;
    } catch (error) {
      logger.error(
        `Failed to update scheduled transaction ${id}, ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  public async list(userId: string): Promise<ScheduledTransactionDomain[]> {
    try {
      logger.debug('Start list scheduled transactions', { userId });
      const result =
        await scheduledTransactionService.listScheduledTransactions(userId);
      logger.debug('Done list scheduled transactions', result);
      return result;
    } catch (error) {
      logger.error(
        `Failed to list scheduled transactions, ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  public async delete(id: string, userId: string) {
    try {
      logger.debug('Start delete scheduled transaction', id);
      const result =
        await scheduledTransactionService.deleteScheduledTransaction(
          id,
          userId,
        );
      logger.debug('Done delete scheduled transaction', id);
      return result;
    } catch (error) {
      logger.error(
        `Failed to delete scheduled transaction ${id}, ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }
}

export default new ScheduledTransactionController();
