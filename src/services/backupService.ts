import transactionService from '../services/transactionService';
import { Transaction } from '../types/transaction';
import { parse } from 'json2csv';
import logger from '../utils/logger';
import BackupStorageProviderFactory from '../services/backup/backupStorageProviderFactory';

class BackupService {
  private storageProvider = BackupStorageProviderFactory.getProvider();

  constructor() {}

  async backupTransactionsToCsvAndUpload(userId: string) {
    const transactions = await transactionService.getAllTransactions({
      status: 'APPROVED',
      userId,
    });
    const csvRows = transactions.map((t: Transaction) => ({
      date: t.date,
      description: t.description,
      value: t.value,
      type: t.type,
      categoryName: t.category.name,
    }));
    const csv = parse(csvRows, {
      fields: ['date', 'description', 'value', 'type', 'categoryName'],
    });
    const fileName = `transactions-backup_${userId}-${new Date().toISOString().slice(0, 10)}.csv`;
    const fileBuffer = Buffer.from(csv, 'utf8');
    const mimeType = 'text/csv';
    logger.debug(`Uploading backup file: ${fileName}`);
    return this.storageProvider.uploadBackup(fileName, fileBuffer, mimeType);
  }
}

export default new BackupService();
