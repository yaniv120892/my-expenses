import { Import, ImportFileType, ImportStatus } from '@prisma/client';
import prisma from '../prisma/client';

export class ImportRepository {
  async create(data: {
    fileUrl: string;
    originalFileName: string;
    importType: ImportFileType;
    userId: string;
    creditCardLastFourDigits: string;
    paymentMonth: string;
  }): Promise<Import> {
    return prisma.import.create({
      data: {
        ...data,
        status: ImportStatus.PROCESSING,
      },
    });
  }

  async findById(id: string): Promise<Import | null> {
    return prisma.import.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Import[]> {
    return prisma.import.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: ImportStatus,
    error?: string,
  ): Promise<Import> {
    const data: any = {
      status,
      ...(status === ImportStatus.COMPLETED && { completedAt: new Date() }),
      ...(error && { error }),
    };

    return prisma.import.update({
      where: { id },
      data,
    });
  }
}

export const importRepository = new ImportRepository();
