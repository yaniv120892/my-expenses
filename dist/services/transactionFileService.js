"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionFileRepository_1 = __importDefault(require("../repositories/transactionFileRepository"));
const fileUploadService_1 = __importDefault(require("./fileUploadService"));
const logger_1 = __importDefault(require("../utils/logger"));
class TransactionFileService {
    async uploadTransactionFile(file, transactionId, userId) {
        try {
            const uploadResult = await fileUploadService_1.default.uploadTransactionFile(file, userId, transactionId);
            const fileId = await transactionFileRepository_1.default.createTransactionFile(transactionId, uploadResult);
            logger_1.default.debug('Transaction file uploaded successfully', {
                fileId,
                transactionId,
                fileName: uploadResult.fileName,
            });
            return fileId;
        }
        catch (error) {
            logger_1.default.error('Error uploading transaction file', {
                error,
                transactionId,
                fileName: file.originalname,
            });
            throw error;
        }
    }
    async getTransactionFiles(transactionId) {
        return transactionFileRepository_1.default.getTransactionFiles(transactionId);
    }
    async getTransactionFileById(fileId) {
        return transactionFileRepository_1.default.getTransactionFileById(fileId);
    }
    async updateTransactionFile(fileId, file, userId) {
        try {
            const existingFile = await transactionFileRepository_1.default.getTransactionFileById(fileId);
            if (!existingFile) {
                throw new Error('Transaction file not found');
            }
            await fileUploadService_1.default.deleteTransactionFile(existingFile.fileUrl);
            const uploadResult = await fileUploadService_1.default.uploadTransactionFile(file, userId, existingFile.transactionId);
            await transactionFileRepository_1.default.updateTransactionFile(fileId, uploadResult);
            logger_1.default.debug('Transaction file updated successfully', {
                fileId,
                transactionId: existingFile.transactionId,
                fileName: uploadResult.fileName,
            });
        }
        catch (error) {
            logger_1.default.error('Error updating transaction file', {
                error,
                fileId,
                fileName: file.originalname,
            });
            throw error;
        }
    }
    async deleteTransactionFile(fileId) {
        try {
            const existingFile = await transactionFileRepository_1.default.getTransactionFileById(fileId);
            if (!existingFile) {
                throw new Error('Transaction file not found');
            }
            await fileUploadService_1.default.deleteTransactionFile(existingFile.fileUrl);
            await transactionFileRepository_1.default.deleteTransactionFile(fileId);
            logger_1.default.debug('Transaction file deleted successfully', {
                fileId,
                transactionId: existingFile.transactionId,
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting transaction file', {
                error,
                fileId,
            });
            throw error;
        }
    }
    async deleteTransactionFiles(transactionId) {
        try {
            const files = await transactionFileRepository_1.default.getTransactionFiles(transactionId);
            for (const file of files) {
                await fileUploadService_1.default.deleteTransactionFile(file.fileUrl);
            }
            await transactionFileRepository_1.default.deleteTransactionFiles(transactionId);
            logger_1.default.debug('All transaction files deleted successfully', {
                transactionId,
                fileCount: files.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting transaction files', {
                error,
                transactionId,
            });
            throw error;
        }
    }
    getMaxFileSize() {
        return fileUploadService_1.default.getMaxFileSize();
    }
    getAllowedMimeTypes() {
        return fileUploadService_1.default.getAllowedMimeTypes();
    }
    getAllowedFileTypes() {
        return fileUploadService_1.default.getAllowedFileTypes();
    }
}
exports.default = new TransactionFileService();
