import { TransactionType } from '@prisma/client';
import prisma from '..//prisma/client';
import {
  TransactionFilters,
  Transaction,
  TransactionItem,
  TransactionSummaryFilters,
  TransactionSummary,
} from '..//types/transaction';
import { CreateTransactionDbModel } from 'repositories/types';

class TransactionRepository {
  public async deleteTransaction(transactionId: string): Promise<void> {
    await prisma.transaction.delete({
      where: { id: transactionId },
    });
  }

  public async getTransactionsSummary(
    filters: TransactionSummaryFilters,
  ): Promise<TransactionSummary> {
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        categoryId: filters.categoryId,
        type: filters.transactionType,
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
      },
      include: { category: true },
    });

    return transaction.id;
  }

  public async getTransactions(
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        categoryId: filters.categoryId,
        type: filters.transactionType,
        description: {
          contains: filters.searchTerm,
        },
      },
      take: filters.perPage,
      skip: (filters.page - 1) * filters.perPage,
      include: { category: true },
    });

    return transactions.map(this.mapToDomain);
  }

  public async getTransactionItem(
    data: TransactionItem,
  ): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.id },
      include: { category: true },
    });

    return transaction ? this.mapToDomain(transaction) : null;
  }

  public async updateTransaction(
    transactionId: string,
    updateData: Partial<CreateTransactionDbModel>,
  ): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        description: updateData.description,
        value: updateData.value,
        date: updateData.date,
        categoryId: updateData.categoryId,
      },
    });
  }

  private mapToDomain(transaction: any): Transaction {
    return {
      id: transaction.id,
      description: transaction.description,
      value: transaction.value,
      date: transaction.date,
      type: transaction.type,
      category: {
        id: transaction.category.id,
        name: transaction.category.name,
      },
    };
  }
}

export default new TransactionRepository();
