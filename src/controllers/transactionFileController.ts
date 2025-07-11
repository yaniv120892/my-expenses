import { Request, Response } from 'express';
import '../types/multer';
import transactionFileService from '../services/transactionFileService';
import logger from '../utils/logger';

class TransactionFileController {
  async uploadTransactionFile(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const userId = req.userId as string;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileId = await transactionFileService.uploadTransactionFile(
        req.file,
        transactionId,
        userId
      );

      logger.debug('Transaction file uploaded successfully', {
        fileId,
        transactionId,
        userId,
      });

      res.status(201).json({ fileId });
    } catch (error: any) {
      logger.error('Error uploading transaction file', {
        error: error.message,
        transactionId: req.params.transactionId,
        userId: req.userId,
      });
      res.status(500).json({ error: error.message });
    }
  }

  async getTransactionFiles(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      
      const files = await transactionFileService.getTransactionFiles(transactionId);

      res.json(files);
    } catch (error: any) {
      logger.error('Error getting transaction files', {
        error: error.message,
        transactionId: req.params.transactionId,
      });
      res.status(500).json({ error: error.message });
    }
  }

  async getTransactionFileById(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      
      const file = await transactionFileService.getTransactionFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json(file);
    } catch (error: any) {
      logger.error('Error getting transaction file', {
        error: error.message,
        fileId: req.params.fileId,
      });
      res.status(500).json({ error: error.message });
    }
  }

  async updateTransactionFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const userId = req.userId as string;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      await transactionFileService.updateTransactionFile(
        fileId,
        req.file,
        userId
      );

      logger.debug('Transaction file updated successfully', {
        fileId,
        userId,
      });

      res.json({ message: 'File updated successfully' });
    } catch (error: any) {
      logger.error('Error updating transaction file', {
        error: error.message,
        fileId: req.params.fileId,
        userId: req.userId,
      });
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTransactionFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      
      await transactionFileService.deleteTransactionFile(fileId);

      logger.debug('Transaction file deleted successfully', {
        fileId,
      });

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      logger.error('Error deleting transaction file', {
        error: error.message,
        fileId: req.params.fileId,
      });
      res.status(500).json({ error: error.message });
    }
  }

  async getFileUploadInfo(req: Request, res: Response) {
    try {
      const info = {
        maxFileSize: transactionFileService.getMaxFileSize(),
        allowedMimeTypes: transactionFileService.getAllowedMimeTypes(),
        allowedFileTypes: transactionFileService.getAllowedFileTypes(),
        maxFileSizeMB: Math.round(transactionFileService.getMaxFileSize() / 1024 / 1024),
      };

      res.json(info);
    } catch (error: any) {
      logger.error('Error getting file upload info', {
        error: error.message,
      });
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TransactionFileController();