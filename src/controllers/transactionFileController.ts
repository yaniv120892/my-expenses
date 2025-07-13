import transactionService from '../services/transactionService';
import logger from '../utils/logger';

export class AttachFileRequest {
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
}

class TransactionFileController {
  async attachFile(
    transactionId: string,
    userId: string,
    data: AttachFileRequest,
  ) {
    try {
      const { fileName, fileKey, fileSize, mimeType } = data;
      logger.debug('Start attaching file to transaction', {
        transactionId,
        userId,
        fileName,
        fileKey,
      });

      await transactionService.attachFile(transactionId, userId, {
        fileName,
        fileKey,
        fileSize,
        mimeType,
      });

      logger.debug('Done attaching file to transaction', {
        transactionId,
        userId,
        fileName,
        fileKey,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to attach file to transaction', {
        transactionId,
        userId,
        fileName: data.fileName,
        fileKey: data.fileKey,
        error,
      });
      throw error;
    }
  }

  async getTransactionFiles(transactionId: string, userId: string) {
    try {
      logger.debug('Start getting transaction files', {
        transactionId,
        userId,
      });

      const files = await transactionService.getTransactionFiles(
        transactionId,
        userId,
      );

      logger.debug('Done getting transaction files', {
        transactionId,
        userId,
        fileCount: files.length,
      });

      return files;
    } catch (error) {
      logger.error('Failed to get transaction files', {
        transactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async removeFile(transactionId: string, fileId: string, userId: string) {
    try {
      logger.debug('Start removing file from transaction', {
        transactionId,
        fileId,
        userId,
      });

      await transactionService.removeFile(transactionId, fileId, userId);

      logger.debug('Done removing file from transaction', {
        transactionId,
        fileId,
        userId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to remove file from transaction', {
        transactionId,
        fileId,
        userId,
        error,
      });
      throw error;
    }
  }
}

export const transactionFileController = new TransactionFileController();
