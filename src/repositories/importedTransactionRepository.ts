import {
  ImportedTransaction,
  TransactionType,
  ImportedTransactionStatus,
} from '@prisma/client';
import prisma from '../prisma/client';

export class ImportedTransactionRepository {
  async createMany(
    transactions: {
      importId: string;
      description: string;
      value: number;
      date: Date;
      type: TransactionType;
      matchingTransactionId: string | null;
      rawData: any;
      userId: string;
    }[],
  ): Promise<number> {
    const result = await prisma.importedTransaction.createMany({
      data: transactions,
    });
    return result.count;
  }

  async findByUserIdAndImportId(
    userId: string,
    importId: string,
  ): Promise<ImportedTransaction[]> {
    return prisma.importedTransaction.findMany({
      where: {
        userId,
        importId,
        deleted: false,
      },
      include: {
        matchingTransaction: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByImportId(importId: string): Promise<ImportedTransaction[]> {
    return prisma.importedTransaction.findMany({
      where: {
        importId,
        deleted: false,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string): Promise<ImportedTransaction | null> {
    return prisma.importedTransaction.findUnique({
      where: { id },
      include: {
        matchingTransaction: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.importedTransaction.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    status: ImportedTransactionStatus,
  ): Promise<void> {
    await prisma.importedTransaction.update({
      where: { id, userId },
      data: { status },
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.importedTransaction.update({
      where: { id, userId },
      data: { deleted: true },
    });
  }

  async filterDuplicates(
    importId: string,
    transactions: {
      description: string;
      value: number;
      date: Date;
      type: TransactionType;
      rawData: any;
      matchingTransactionId: string | null;
      userId: string;
    }[],
  ): Promise<typeof transactions> {
    if (transactions.length === 0) return [];

    const existingTransactions = await this.findExistingTransactions(
      importId,
      transactions,
    );

    // Create a set of existing transaction keys for fast lookup
    const existingKeys = new Set(
      existingTransactions.map(
        (tx) => `${tx.description}|${tx.value}|${tx.date.getTime()}|${tx.type}`,
      ),
    );

    // Filter out transactions that already exist
    return transactions.filter((tx) => {
      const key = `${tx.description}|${tx.value}|${tx.date.getTime()}|${tx.type}`;
      return !existingKeys.has(key);
    });
  }


  private async findExistingTransactions(
    importId: string,
    transactions: {
      description: string;
      value: number;
      date: Date;
      type: TransactionType;
    }[],
  ): Promise<ImportedTransaction[]> {
    if (transactions.length === 0) return [];

    // Build a query to find existing transactions that match any of the provided transactions
    const existingTransactions = await prisma.importedTransaction.findMany({
      where: {
        importId,
        OR: transactions.map((tx) => ({
          description: tx.description,
          value: tx.value,
          date: tx.date,
          type: tx.type,
        })),
      },
    });

    return existingTransactions;
  }
}

export const importedTransactionRepository =
  new ImportedTransactionRepository();
