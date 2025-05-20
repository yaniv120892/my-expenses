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
    //TODO: Implement logic to get users who require backup
    return ['f9c8bf03-3085-4431-a35d-ee388470d0eb'];
  }
}

export default new BackupController();
