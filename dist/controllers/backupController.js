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
            const usersRequiredBackup = await this.getUsersRequiredBackup();
            for (const userId of usersRequiredBackup) {
                logger_1.default.debug(`Start backing up transactions for user ${userId}`);
                await backupService_1.default.backupTransactionsToCsvAndUpload(userId);
                logger_1.default.info(`Done backing up transactions for user ${userId}`);
            }
            return {
                message: 'Backup completed successfully',
            };
        }
        catch (error) {
            console.error('Failed to backup transactions', error);
            return {
                message: 'Failed to backup transactions',
            };
        }
    }
    async getUsersRequiredBackup() {
        //TODO: Implement logic to get users who require backup
        return ['f9c8bf03-3085-4431-a35d-ee388470d0eb'];
    }
}
exports.default = new BackupController();
