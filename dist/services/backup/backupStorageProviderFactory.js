"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backupStorageProvider_1 = require("./backupStorageProvider");
const googleStorageProvider_1 = require("./googleStorageProvider");
class BackupStorageProviderFactory {
    static getProvider() {
        const backupStorageProviderType = process.env.BACKUP_STORAGE_PROVIDER_TYPE ||
            backupStorageProvider_1.BackupStorageProviderType.GOOGLE;
        switch (backupStorageProviderType) {
            case backupStorageProvider_1.BackupStorageProviderType.GOOGLE:
            default:
                return new googleStorageProvider_1.GoogleStorageProvider();
        }
    }
}
exports.default = BackupStorageProviderFactory;
