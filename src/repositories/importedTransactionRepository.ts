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
}

export const importedTransactionRepository =
  new ImportedTransactionRepository();
