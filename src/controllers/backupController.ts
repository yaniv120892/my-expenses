import logger from '../utils/logger';
import backupService from '../services/backupService';

class BackupController {
  async backupTransactions() {
    try {
      logger.info('Starting backup of transactions');
      const fileUrl = await backupService.backupTransactionsToCsvAndUpload();
      logger.info(`Done backing up transactions, file URL: ${fileUrl}`);
      return {
        message: 'Backup completed successfully',
        fileUrl,
      };
    } catch (error) {
      console.error('Failed to backup transactions', error);
      return {
        message: 'Failed to backup transactions',
      };
    }
  }
}

export default new BackupController();
