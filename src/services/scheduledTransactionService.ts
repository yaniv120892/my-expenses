import scheduledTransactionRepository from '../repositories/scheduledTransactionRepository';
import transactionService from './transactionService';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDay,
  setDate,
  isAfter,
  startOfDay,
} from 'date-fns';
import {
  CreateScheduledTransaction,
  UpdateScheduledTransaction,
  ScheduledTransactionDomain,
} from '../types/scheduledTransaction';
//TODO: remove this import and create an enum for schedule types that is not depending on Prisma
import { ScheduleType } from '@prisma/client';

class ScheduledTransactionService {
  public async processDueScheduledTransactions(date: Date) {
    const dueScheduledTransactions =
      await scheduledTransactionRepository.getDueScheduledTransactions(
        date,
      );
    for (const scheduled of dueScheduledTransactions) {
      await transactionService.createTransaction({
        description: scheduled.description,
        value: scheduled.value,
        categoryId: scheduled.categoryId,
        type: scheduled.type,
        date,
        status: 'PENDING_APPROVAL',
        userId: scheduled.userId,
      });
      const nextRunDate = this.calculateNextRunDate(
        scheduled.scheduleType,
        scheduled.interval,
        date,
        scheduled.dayOfWeek,
        scheduled.dayOfMonth,
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
    dayOfWeek?: number,
    dayOfMonth?: number,
  ): Date {
    const intervalValue = interval || 1;
    switch (scheduleType) {
      case 'DAILY':
        return startOfDay(addDays(fromDate, intervalValue));
      case 'WEEKLY': {
        const baseDate = addWeeks(fromDate, intervalValue);
        if (dayOfWeek !== undefined) {
          let next = setDay(baseDate, dayOfWeek, { weekStartsOn: 1 });
          if (!isAfter(next, fromDate)) {
            next = addWeeks(next, 1);
          }
          return startOfDay(next);
        }
        return startOfDay(baseDate);
      }
      case 'MONTHLY': {
        if (dayOfMonth !== undefined) {
          const currentMonthDate = setDate(new Date(fromDate), dayOfMonth);
          if (isAfter(currentMonthDate, fromDate)) {
            return startOfDay(currentMonthDate);
          }
          const nextMonth = addMonths(fromDate, intervalValue);
          return startOfDay(setDate(nextMonth, dayOfMonth));
        }
        return startOfDay(addMonths(fromDate, intervalValue));
      }
      case 'YEARLY':
        return startOfDay(addYears(fromDate, intervalValue));
      case 'CUSTOM':
        return startOfDay(addDays(fromDate, intervalValue));
      default:
        return startOfDay(addDays(fromDate, 1));
    }
  }

  public async createScheduledTransaction(
    data: CreateScheduledTransaction,
  ): Promise<string> {
    const nextRunDate = this.calculateNextRunDate(
      data.scheduleType,
      data.interval,
      new Date(),
      data.dayOfWeek,
      data.dayOfMonth,
    );
    return scheduledTransactionRepository.createScheduledTransaction(
      data,
      nextRunDate,
    );
  }

  public async updateScheduledTransaction(
    id: string,
    data: UpdateScheduledTransaction,
    userId: string,
  ): Promise<string> {
    const oldScheduledTransaction =
      await scheduledTransactionRepository.getScheduledTransactionById(
        id,
        userId,
      );
    const nextRunDate = this.calculateNextRunDate(
      data.scheduleType,
      data.interval,
      oldScheduledTransaction?.lastRunDate || new Date(),
      data.dayOfWeek,
      data.dayOfMonth,
    );
    return scheduledTransactionRepository.updateScheduledTransaction(
      id,
      data,
      userId,
      nextRunDate,
    );
  }

  public async listScheduledTransactions(
    userId: string,
  ): Promise<ScheduledTransactionDomain[]> {
    return scheduledTransactionRepository.getAllScheduledTransactions(userId);
  }

  public async deleteScheduledTransaction(
    id: string,
    userId: string,
  ): Promise<void> {
    return scheduledTransactionRepository.deleteScheduledTransaction(
      id,
      userId,
    );
  }
}

export default new ScheduledTransactionService();
