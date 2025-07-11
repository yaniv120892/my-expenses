import { TransactionFile, CreateTransactionFile } from '../types/transaction';
import transactionFileRepository from '../repositories/transactionFileRepository';
import fileUploadService, { UploadFile } from './fileUploadService';
import logger from '../utils/logger';

class TransactionFileService {
  async uploadTransactionFile(
    file: UploadFile,
    transactionId: string,
    userId: string
  ): Promise<string> {
    try {
      const uploadResult = await fileUploadService.uploadTransactionFile(
        file,
        userId,
        transactionId
      );

      const fileId = await transactionFileRepository.createTransactionFile(
        transactionId,
        uploadResult
      );

      logger.debug('Transaction file uploaded successfully', {
        fileId,
        transactionId,
        fileName: uploadResult.fileName,
      });

      return fileId;
    } catch (error) {
      logger.error('Error uploading transaction file', {
        error,
        transactionId,
        fileName: file.originalname,
      });
      throw error;
    }
  }

  async getTransactionFiles(transactionId: string): Promise<TransactionFile[]> {
    return transactionFileRepository.getTransactionFiles(transactionId);
  }

  async getTransactionFileById(fileId: string): Promise<TransactionFile | null> {
    return transactionFileRepository.getTransactionFileById(fileId);
  }

  async updateTransactionFile(
    fileId: string,
    file: UploadFile,
    userId: string
  ): Promise<void> {
    try {
      const existingFile = await transactionFileRepository.getTransactionFileById(fileId);
      if (!existingFile) {
        throw new Error('Transaction file not found');
      }

      await fileUploadService.deleteTransactionFile(existingFile.fileUrl);

      const uploadResult = await fileUploadService.uploadTransactionFile(
        file,
        userId,
        existingFile.transactionId
      );

      await transactionFileRepository.updateTransactionFile(fileId, uploadResult);

      logger.debug('Transaction file updated successfully', {
        fileId,
        transactionId: existingFile.transactionId,
        fileName: uploadResult.fileName,
      });
    } catch (error) {
      logger.error('Error updating transaction file', {
        error,
        fileId,
        fileName: file.originalname,
      });
      throw error;
    }
  }

  async deleteTransactionFile(fileId: string): Promise<void> {
    try {
      const existingFile = await transactionFileRepository.getTransactionFileById(fileId);
      if (!existingFile) {
        throw new Error('Transaction file not found');
      }

      await fileUploadService.deleteTransactionFile(existingFile.fileUrl);
      await transactionFileRepository.deleteTransactionFile(fileId);

      logger.debug('Transaction file deleted successfully', {
        fileId,
        transactionId: existingFile.transactionId,
      });
    } catch (error) {
      logger.error('Error deleting transaction file', {
        error,
        fileId,
      });
      throw error;
    }
  }

  async deleteTransactionFiles(transactionId: string): Promise<void> {
    try {
      const files = await transactionFileRepository.getTransactionFiles(transactionId);
      
      for (const file of files) {
        await fileUploadService.deleteTransactionFile(file.fileUrl);
      }

      await transactionFileRepository.deleteTransactionFiles(transactionId);

      logger.debug('All transaction files deleted successfully', {
        transactionId,
        fileCount: files.length,
      });
    } catch (error) {
      logger.error('Error deleting transaction files', {
        error,
        transactionId,
      });
      throw error;
    }
  }

  getMaxFileSize(): number {
    return fileUploadService.getMaxFileSize();
  }

  getAllowedMimeTypes(): string[] {
    return fileUploadService.getAllowedMimeTypes();
  }

  getAllowedFileTypes(): string[] {
    return fileUploadService.getAllowedFileTypes();
  }
}

export default new TransactionFileService();