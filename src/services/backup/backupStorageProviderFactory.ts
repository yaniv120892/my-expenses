import { AwsStorageProvider } from './awsStorageProvider';
import {
  BackupStorageProvider,
  BackupStorageProviderType,
} from './backupStorageProvider';
import { GoogleStorageProvider } from './googleStorageProvider';

class BackupStorageProviderFactory {
  static getProvider(): BackupStorageProvider {
    const backupStorageProviderType =
      process.env.BACKUP_STORAGE_PROVIDER_TYPE || BackupStorageProviderType.AWS;
    switch (backupStorageProviderType) {
      case BackupStorageProviderType.AWS: {
        return new AwsStorageProvider();
      }
      case BackupStorageProviderType.GOOGLE:
      default: {
        return new GoogleStorageProvider();
      }
    }
  }
}

export default BackupStorageProviderFactory;
