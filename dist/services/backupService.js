"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionService_1 = __importDefault(require("../services/transactionService"));
const json2csv_1 = require("json2csv");
const logger_1 = __importDefault(require("../utils/logger"));
const backupStorageProviderFactory_1 = __importDefault(require("../services/backup/backupStorageProviderFactory"));
const userRepository_1 = __importDefault(require("repositories/userRepository"));
class BackupService {
    constructor() {
        this.storageProvider = backupStorageProviderFactory_1.default.getProvider();
    }
    async getUsersRequiredBackup() {
        const users = await userRepository_1.default.list({
            isVerified: true,
        });
        return users;
    }
    async backupTransactionsToCsvAndUpload(userId) {
        const transactions = await transactionService_1.default.getAllTransactions({
            status: 'APPROVED',
            userId,
        });
        const csvRows = transactions.map((t) => ({
            date: t.date,
            description: t.description,
            value: t.value,
            type: t.type,
            categoryName: t.category.name,
        }));
        const csv = (0, json2csv_1.parse)(csvRows, {
            fields: ['date', 'description', 'value', 'type', 'categoryName'],
        });
        const fileName = `transactions-backup_${userId}-${new Date().toISOString().slice(0, 10)}.csv`;
        const fileBuffer = Buffer.from(csv, 'utf8');
        const mimeType = 'text/csv';
        logger_1.default.debug(`Uploading backup file: ${fileName}`);
        return this.storageProvider.uploadBackup(fileName, fileBuffer, mimeType);
    }
}
exports.default = new BackupService();
