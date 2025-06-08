import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
} from 'class-validator';
import { ImportFileType } from '@prisma/client';
import { importService } from '../services/importService';
import logger from '../utils/logger';
import { TransactionType } from '../types/transaction';
import { Type } from 'class-transformer';

export class ProcessImportRequest {
  @IsString()
  fileUrl: string;

  @IsString()
  originalFileName: string;

  @IsString()
  @IsOptional()
  paymentMonth?: string;
}

export class GetImportedTransactionsRequest {
  @IsString()
  importId: string;
}

export class ApproveImportedTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  value: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  type: TransactionType;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class IgnoreImportedTransactionRequest {
  @IsString()
  transactionId: string;
}

export class MergeImportedTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  value: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  type: TransactionType;

  @IsString()
  categoryId: string;
}

class ImportController {
  async processImport(req: ProcessImportRequest, userId: string) {
    const { fileUrl, originalFileName, paymentMonth } = req;
    try {
      logger.debug('Start process import', {
        fileUrl,
        originalFileName,
        paymentMonth,
        userId,
      });
      const result = await importService.processImport(
        fileUrl,
        userId,
        originalFileName,
        paymentMonth,
      );
      logger.debug('Done process import', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to process import`, {
        fileUrl,
        originalFileName,
        paymentMonth,
        userId,
        error,
      });
      throw error;
    }
  }

  async getImports(userId: string) {
    try {
      logger.debug('Start get imports', { userId });
      const result = await importService.getImports(userId);
      logger.debug('Done get imports', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to get imports`, { userId, error });
      throw error;
    }
  }

  async getImportedTransactions(
    req: GetImportedTransactionsRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start get imported transactions', {
        req,
        userId,
      });
      const result = await importService.getImportedTransactions(
        req.importId,
        userId,
      );
      logger.debug('Done get imported transactions', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to get imported transactions`, {
        req,
        userId,
        error,
      });
      throw error;
    }
  }

  async approveImportedTransaction(
    importedTransactionId: string,
    userId: string,
    data: ApproveImportedTransactionRequest,
  ) {
    try {
      logger.debug('Start approve imported transaction', {
        importedTransactionId,
        userId,
        data,
      });

      await importService.approveImportedTransaction(
        importedTransactionId,
        userId,
        {
          description: data.description,
          value: data.value,
          date: data.date,
          type: data.type,
          categoryId: data.categoryId ?? null,
        },
      );
      logger.debug('Done approve imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to approve imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async mergeImportedTransaction(
    importedTransactionId: string,
    userId: string,
    data: MergeImportedTransactionRequest,
  ) {
    try {
      logger.debug('Start merge imported transaction', {
        importedTransactionId,
        userId,
        data,
      });
      await importService.mergeImportedTransaction(
        importedTransactionId,
        userId,
        data,
      );
      logger.debug('Done merge imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to merge imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async ignoreImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    try {
      logger.debug('Start ignore imported transaction', {
        importedTransactionId,
        userId,
      });

      await importService.ignoreImportedTransaction(
        importedTransactionId,
        userId,
      );
      logger.debug('Done ignore imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to ignore imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async deleteImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    try {
      logger.debug('Start delete imported transaction', {
        importedTransactionId,
        userId,
      });

      await importService.deleteImportedTransaction(
        importedTransactionId,
        userId,
      );
      logger.debug('Done delete imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }
}

export const importController = new ImportController();
