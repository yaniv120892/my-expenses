import { PrismaClient } from '@prisma/client';
import { TransactionFile, CreateTransactionFile } from '../types/transaction';
import prisma from '../prisma/client';

class TransactionFileRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createTransactionFile(
    transactionId: string,
    fileData: CreateTransactionFile
  ): Promise<string> {
    const result = await this.prisma.transactionFile.create({
      data: {
        transactionId,
        ...fileData,
      },
    });
    return result.id;
  }

  async getTransactionFiles(transactionId: string): Promise<TransactionFile[]> {
    const files = await this.prisma.transactionFile.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });
    return files;
  }

  async getTransactionFileById(fileId: string): Promise<TransactionFile | null> {
    return await this.prisma.transactionFile.findUnique({
      where: { id: fileId },
    });
  }

  async updateTransactionFile(
    fileId: string,
    updateData: Partial<CreateTransactionFile>
  ): Promise<void> {
    await this.prisma.transactionFile.update({
      where: { id: fileId },
      data: updateData,
    });
  }

  async deleteTransactionFile(fileId: string): Promise<void> {
    await this.prisma.transactionFile.delete({
      where: { id: fileId },
    });
  }

  async deleteTransactionFiles(transactionId: string): Promise<void> {
    await this.prisma.transactionFile.deleteMany({
      where: { transactionId },
    });
  }
}

export default new TransactionFileRepository();