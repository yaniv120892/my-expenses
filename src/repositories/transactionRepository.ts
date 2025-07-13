import { TransactionType, TransactionStatus } from '@prisma/client';
import prisma from '../prisma/client';
import {
  TransactionFilters,
  Transaction,
  TransactionSummaryFilters,
  TransactionSummary,
} from '..//types/transaction';
import {
  CreateTransactionDbModel,
  UpdateTransactionDbModel,
} from 'repositories/types';
import { endOfDay, startOfDay } from 'date-fns';

class TransactionRepository {
  public async getTransactionsSummary(
    filters: TransactionSummaryFilters,
  ): Promise<TransactionSummary> {
    const { startDate, endDate } = this.getNormalizedDateRange(
      filters.startDate,
      filters.endDate,
    );
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        categoryId: filters.categoryId,
        type: filters.transactionType,
        status: filters.status || TransactionStatus.APPROVED,
        userId: filters.userId,
      },
    });

    const totalIncome = transactions
      .filter((transaction) => transaction.type === TransactionType.INCOME)
      .reduce((acc, transaction) => acc + transaction.value, 0);

    const totalExpense = transactions
      .filter((transaction) => transaction.type === TransactionType.EXPENSE)
      .reduce((acc, transaction) => acc + transaction.value, 0);

    return { totalIncome, totalExpense };
  }

  public async createTransaction(
    data: CreateTransactionDbModel,
  ): Promise<string> {
    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        value: data.value,
        date: data.date,
        categoryId: data.categoryId,
        type: data.type,
        status: data.status || TransactionStatus.APPROVED,
        userId: data.userId,
      },
      include: { category: true },
    });

    return transaction.id;
  }

  public async getTransactions(
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    const { startDate, endDate } = this.getNormalizedDateRange(
      filters.startDate,
      filters.endDate,
    );

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(filters.startDate && filters.endDate
          ? { date: { gte: startDate, lte: endDate } }
          : filters.startDate
            ? { date: { gte: startDate } }
            : filters.endDate
              ? { date: { lte: endDate } }
              : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.transactionType ? { type: filters.transactionType } : {}),
        ...(filters.searchTerm
          ? { description: { contains: filters.searchTerm } }
          : {}),
        status: filters.status || TransactionStatus.APPROVED,
        userId: filters.userId,
      },
      take: filters.perPage,
      skip: (filters.page - 1) * filters.perPage,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return transactions.map(this.mapToDomain);
  }

  public async getPendingTransactions(userId: string): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: { status: TransactionStatus.PENDING_APPROVAL, userId: userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
    return transactions.map(this.mapToDomain);
  }

  public async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    userId: string,
  ): Promise<string> {
    const transaction = await prisma.transaction.update({
      where: { id, userId },
      data: { status },
    });
    return transaction.id;
  }

  public async getTransactionItem(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, userId },
      include: {
        category: true,
        files: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return transaction ? this.mapToDomain(transaction) : null;
  }

  private mapToDomain(transaction: any): Transaction {
    return {
      id: transaction.id,
      description: transaction.description,
      value: transaction.value,
      date: transaction.date,
      type: transaction.type,
      status: transaction.status,
      category: {
        id: transaction.category.id,
        name: transaction.category.name,
      },
      files:
        transaction.files?.map((file: any) => ({
          id: file.id,
          transactionId: file.transactionId,
          fileName: file.fileName,
          fileKey: file.fileKey,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          status: file.status,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        })) || [],
    };
  }

  public async updateTransaction(
    id: string,
    data: UpdateTransactionDbModel,
    userId: string,
  ): Promise<string> {
    const transaction = await prisma.transaction.update({
      where: { id, userId },
      data: {
        description: data.description,
        value: data.value,
        date: data.date,
        categoryId: data.categoryId,
        type: data.type,
        status: data.status,
      },
    });
    return transaction.id;
  }

  public async deleteTransaction(id: string, userId: string): Promise<void> {
    await prisma.transaction.delete({
      where: { id, userId },
    });
  }

  private getNormalizedDateRange(startDate?: Date, endDate?: Date) {
    let normalizedStartDate = startDate
      ? startOfDay(new Date(startDate))
      : undefined;
    let normalizedEndDate = endDate ? endOfDay(new Date(endDate)) : undefined;
    return { startDate: normalizedStartDate, endDate: normalizedEndDate };
  }

  public async findPotentialMatches(
    userId: string,
    date: Date,
    value: number,
    tolerance: number = 2,
    dayRange: number = 2,
  ): Promise<Transaction[]> {
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - dayRange);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + dayRange);

    const potentialTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        value: {
          gte: value - tolerance,
          lte: value + tolerance,
        },
        status: TransactionStatus.APPROVED,
      },
      include: { category: true },
    });

    return potentialTransactions.map(this.mapToDomain);
  }
}

export default new TransactionRepository();
