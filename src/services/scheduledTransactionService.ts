import scheduledTransactionRepository from '../repositories/scheduledTransactionRepository';
import transactionService from './transactionService';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import {
  CreateScheduledTransaction,
  UpdateScheduledTransaction,
  ScheduledTransactionDomain,
} from '../types/scheduledTransaction';

class ScheduledTransactionService {
  public async processDueScheduledTransactions(date: Date): Promise<void> {
    const dueScheduledTransactions =
      await scheduledTransactionRepository.getDueScheduledTransactions(date);
    for (const scheduled of dueScheduledTransactions) {
      await transactionService.createTransaction({
        description: scheduled.description,
        value: scheduled.value,
        categoryId: scheduled.categoryId,
        type: scheduled.type,
        date,
        status: 'PENDING_APPROVAL',
      });
      const nextRunDate = this.calculateNextRunDate(scheduled, date);
      await scheduledTransactionRepository.updateLastRunAndNextRun(
        scheduled.id,
        date,
        nextRunDate,
      );
    }
  }

  private calculateNextRunDate(
    scheduled: ScheduledTransactionDomain,
    fromDate: Date,
  ): Date {
    switch (scheduled.scheduleType) {
      case 'DAILY':
        return addDays(fromDate, scheduled.interval || 1);
      case 'WEEKLY':
        return addWeeks(fromDate, scheduled.interval || 1);
      case 'MONTHLY':
        return addMonths(fromDate, scheduled.interval || 1);
      case 'YEARLY':
        return addYears(fromDate, scheduled.interval || 1);
      case 'CUSTOM':
        return addDays(fromDate, scheduled.interval || 1);
      default:
        return addDays(fromDate, 1);
    }
  }

  public async createScheduledTransaction(
    data: CreateScheduledTransaction,
  ): Promise<string> {
    return scheduledTransactionRepository.createScheduledTransaction(data);
  }

  public async updateScheduledTransaction(
    id: string,
    data: UpdateScheduledTransaction,
  ): Promise<string> {
    return scheduledTransactionRepository.updateScheduledTransaction(id, data);
  }

  public async listScheduledTransactions(): Promise<
    ScheduledTransactionDomain[]
  > {
    return scheduledTransactionRepository.getAllScheduledTransactions();
  }

  public async deleteScheduledTransaction(id: string): Promise<void> {
    return scheduledTransactionRepository.deleteScheduledTransaction(id);
  }
}

export default new ScheduledTransactionService();
