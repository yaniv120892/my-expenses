"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const backupService_1 = __importDefault(require("../services/backupService"));
class BackupController {
    async backupTransactions() {
        try {
            logger_1.default.info('Starting backup of transactions');
            const fileUrl = await backupService_1.default.backupTransactionsToCsvAndUpload();
            logger_1.default.info(`Done backing up transactions, file URL: ${fileUrl}`);
            return {
                message: 'Backup completed successfully',
                fileUrl,
            };
        }
        catch (error) {
            console.error('Failed to backup transactions', error);
            return {
                message: 'Failed to backup transactions',
            };
        }
    }
}
exports.default = new BackupController();
