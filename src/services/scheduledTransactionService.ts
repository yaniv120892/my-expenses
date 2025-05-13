import scheduledTransactionRepository from '../repositories/scheduledTransactionRepository';
import transactionService from './transactionService';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import {
  CreateScheduledTransaction,
  UpdateScheduledTransaction,
  ScheduledTransactionDomain,
} from '../types/scheduledTransaction';
import { ScheduleType } from '@prisma/client';

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
      const nextRunDate = this.calculateNextRunDate(
        scheduled.scheduleType,
        scheduled.interval,
        date,
      );
      await scheduledTransactionRepository.updateLastRunAndNextRun(
        scheduled.id,
        date,
        nextRunDate,
      );
    }
  }

  private calculateNextRunDate(
    scheduleType: ScheduleType,
    interval: number | undefined,
    fromDate: Date,
  ): Date {
    switch (scheduleType) {
      case 'DAILY':
        return addDays(fromDate, interval || 1);
      case 'WEEKLY':
        return addWeeks(fromDate, interval || 1);
      case 'MONTHLY':
        return addMonths(fromDate, interval || 1);
      case 'YEARLY':
        return addYears(fromDate, interval || 1);
      case 'CUSTOM':
        return addDays(fromDate, interval || 1);
      default:
        return addDays(fromDate, 1);
    }
  }

  public async createScheduledTransaction(
    data: CreateScheduledTransaction,
  ): Promise<string> {
    const nextRunDate = this.calculateNextRunDate(
      data.scheduleType,
      data.interval,
      new Date(),
    );
    return scheduledTransactionRepository.createScheduledTransaction(
      data,
      nextRunDate,
    );
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
