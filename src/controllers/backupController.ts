import logger from '../utils/logger';
import backupService from '../services/backupService';

class BackupController {
  async backupTransactions() {
    try {
      logger.info('Starting backup of transactions');
      const usersRequiredBackup = await this.getUsersRequiredBackup();
      for (const userId of usersRequiredBackup) {
        logger.debug(`Start backing up transactions for user ${userId}`);
        await backupService.backupTransactionsToCsvAndUpload(userId);
        logger.info(`Done backing up transactions for user ${userId}`);
      }
      return {
        message: 'Backup completed successfully',
      };
    } catch (error) {
      console.error('Failed to backup transactions', error);
      return {
        message: 'Failed to backup transactions',
      };
    }
  }

  private async getUsersRequiredBackup() {
    const users = await backupService.getUsersRequiredBackup();
    if (!users || users.length === 0) {
      logger.info('No users require backup');
      return [];
    }
    logger.info(`Found ${users.length} users requiring backup`);
    return users.map((user) => user.id);
  }
}

export default new BackupController();
