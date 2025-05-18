import {
  BackupStorageProvider,
  BackupStorageProviderType,
} from './backupStorageProvider';
import { GoogleStorageProvider } from './googleStorageProvider';

class BackupStorageProviderFactory {
  static getProvider(): BackupStorageProvider {
    const backupStorageProviderType =
      process.env.BACKUP_STORAGE_PROVIDER_TYPE ||
      BackupStorageProviderType.GOOGLE;
    switch (backupStorageProviderType) {
      case BackupStorageProviderType.GOOGLE:
      default:
        return new GoogleStorageProvider();
    }
  }
}

export default BackupStorageProviderFactory;
