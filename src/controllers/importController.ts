import { IsString, IsEnum } from 'class-validator';
import { ImportFileType } from '@prisma/client';
import { importService } from '../services/importService';
import logger from '../utils/logger';

export class ProcessImportRequest {
  @IsString()
  fileUrl: string;

  @IsEnum(ImportFileType)
  importType: ImportFileType;
}

export class GetImportedTransactionsRequest {
  @IsString()
  importId: string;
}

export class ApproveImportedTransactionRequest {
  @IsString()
  transactionId: string;
}

export class RejectImportedTransactionRequest {
  @IsString()
  transactionId: string;
}

class ImportController {
  async processImport(req: ProcessImportRequest, userId: string) {
    const { fileUrl, importType } = req;
    try {
      logger.debug('Start process import', { fileUrl, importType, userId });
      const result = await importService.processImport(
        fileUrl,
        importType,
        userId,
      );
      logger.debug('Done process import', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to process import`, {
        fileUrl,
        importType,
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
  ) {
    try {
      logger.debug('Start approve imported transaction', {
        importedTransactionId,
        userId,
      });

      await importService.approveImportedTransaction(
        importedTransactionId,
        userId,
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
  ) {
    try {
      logger.debug('Start merge imported transaction', {
        importedTransactionId,
        userId,
      });
      await importService.mergeImportedTransaction(
        importedTransactionId,
        userId,
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

  async rejectImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    try {
      logger.debug('Start reject imported transaction', {
        importedTransactionId,
        userId,
      });

      await importService.rejectImportedTransaction(
        importedTransactionId,
        userId,
      );
      logger.debug('Done reject imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to reject imported transaction`, {
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
