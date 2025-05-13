import prisma from '../prisma/client';
import {
  CreateScheduledTransaction,
  UpdateScheduledTransaction,
  ScheduledTransactionDomain,
} from '../types/scheduledTransaction';

class ScheduledTransactionRepository {
  private mapScheduledTransactionDbToDomain(
    db: any,
  ): ScheduledTransactionDomain {
    return {
      id: db.id,
      description: db.description,
      value: db.value,
      type: db.type,
      categoryId: db.categoryId,
      scheduleType: db.scheduleType,
      interval: db.interval === null ? undefined : db.interval,
      dayOfWeek: db.dayOfWeek === null ? undefined : db.dayOfWeek,
      dayOfMonth: db.dayOfMonth === null ? undefined : db.dayOfMonth,
      monthOfYear: db.monthOfYear === null ? undefined : db.monthOfYear,
      lastRunDate: db.lastRunDate === null ? undefined : db.lastRunDate,
      nextRunDate: db.nextRunDate === null ? undefined : db.nextRunDate,
    };
  }

  public async createScheduledTransaction(
    data: CreateScheduledTransaction,
    nextRunDate: Date,
  ): Promise<string> {
    const scheduledTransaction = await prisma.scheduledTransaction.create({
      data: {
        ...data,
        nextRunDate,
      },
    });
    return scheduledTransaction.id;
  }

  public async getAllScheduledTransactions(): Promise<
    ScheduledTransactionDomain[]
  > {
    const scheduledTransactions = await prisma.scheduledTransaction.findMany();
    return scheduledTransactions.map(this.mapScheduledTransactionDbToDomain);
  }

  public async getDueScheduledTransactions(
    date: Date,
  ): Promise<ScheduledTransactionDomain[]> {
    const scheduledTransactions = await prisma.scheduledTransaction.findMany({
      where: {
        nextRunDate: { lte: date },
      },
    });
    return scheduledTransactions.map(this.mapScheduledTransactionDbToDomain);
  }

  public async updateLastRunAndNextRun(
    id: string,
    lastRunDate: Date,
    nextRunDate: Date,
  ): Promise<void> {
    await prisma.scheduledTransaction.update({
      where: { id },
      data: { lastRunDate, nextRunDate },
    });
  }

  public async updateScheduledTransaction(
    id: string,
    data: UpdateScheduledTransaction,
  ): Promise<string> {
    const scheduledTransaction = await prisma.scheduledTransaction.update({
      where: { id },
      data,
    });
    return scheduledTransaction.id;
  }

  public async deleteScheduledTransaction(id: string): Promise<void> {
    await prisma.scheduledTransaction.delete({ where: { id } });
  }
}

export default new ScheduledTransactionRepository();
