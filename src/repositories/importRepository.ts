import {
  Import,
  ImportFileType,
  ImportStatus,
  ImportBankSourceType,
} from '@prisma/client';
import prisma from '../prisma/client';

export class ImportRepository {
  async create(data: {
    fileUrl: string;
    originalFileName: string;
    importType: ImportFileType | null;
    bankSourceType: ImportBankSourceType | null;
    userId: string;
    creditCardLastFourDigits?: string | null;
    paymentMonth: string | null;
    excelExtractionRequestId: string | null;
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
      orderBy: [{ createdAt: 'desc' }, { paymentMonth: 'desc' }],
    });
  }

  async findByExtractionRequestId(
    excelExtractionRequestId: string,
  ): Promise<Import | null> {
    return prisma.import.findFirst({
      where: { excelExtractionRequestId },
    });
  }

  async findExisting(
    userId: string,
    paymentMonth: string,
    creditCardLastFourDigits: string,
    bankSourceType: ImportBankSourceType,
  ): Promise<Import | null> {
    const imports = await prisma.import.findMany({
      where: {
        userId,
        paymentMonth,
        bankSourceType,
      },
      orderBy: { createdAt: 'desc' },
    });

    // The prisma-field-encryption middleware will automatically decrypt
    // the creditCardLastFourDigits field when we access it.
    for (const imp of imports) {
      if (imp.creditCardLastFourDigits === creditCardLastFourDigits) {
        return imp;
      }
    }

    return null;
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
