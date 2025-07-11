"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../types/multer");
const transactionFileService_1 = __importDefault(require("../services/transactionFileService"));
const logger_1 = __importDefault(require("../utils/logger"));
class TransactionFileController {
    async uploadTransactionFile(req, res) {
        try {
            const { transactionId } = req.params;
            const userId = req.userId;
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const fileId = await transactionFileService_1.default.uploadTransactionFile(req.file, transactionId, userId);
            logger_1.default.debug('Transaction file uploaded successfully', {
                fileId,
                transactionId,
                userId,
            });
            res.status(201).json({ fileId });
        }
        catch (error) {
            logger_1.default.error('Error uploading transaction file', {
                error: error.message,
                transactionId: req.params.transactionId,
                userId: req.userId,
            });
            res.status(500).json({ error: error.message });
        }
    }
    async getTransactionFiles(req, res) {
        try {
            const { transactionId } = req.params;
            const files = await transactionFileService_1.default.getTransactionFiles(transactionId);
            res.json(files);
        }
        catch (error) {
            logger_1.default.error('Error getting transaction files', {
                error: error.message,
                transactionId: req.params.transactionId,
            });
            res.status(500).json({ error: error.message });
        }
    }
    async getTransactionFileById(req, res) {
        try {
            const { fileId } = req.params;
            const file = await transactionFileService_1.default.getTransactionFileById(fileId);
            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }
            res.json(file);
        }
        catch (error) {
            logger_1.default.error('Error getting transaction file', {
                error: error.message,
                fileId: req.params.fileId,
            });
            res.status(500).json({ error: error.message });
        }
    }
    async updateTransactionFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.userId;
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            await transactionFileService_1.default.updateTransactionFile(fileId, req.file, userId);
            logger_1.default.debug('Transaction file updated successfully', {
                fileId,
                userId,
            });
            res.json({ message: 'File updated successfully' });
        }
        catch (error) {
            logger_1.default.error('Error updating transaction file', {
                error: error.message,
                fileId: req.params.fileId,
                userId: req.userId,
            });
            res.status(500).json({ error: error.message });
        }
    }
    async deleteTransactionFile(req, res) {
        try {
            const { fileId } = req.params;
            await transactionFileService_1.default.deleteTransactionFile(fileId);
            logger_1.default.debug('Transaction file deleted successfully', {
                fileId,
            });
            res.json({ message: 'File deleted successfully' });
        }
        catch (error) {
            logger_1.default.error('Error deleting transaction file', {
                error: error.message,
                fileId: req.params.fileId,
            });
            res.status(500).json({ error: error.message });
        }
    }
    async getFileUploadInfo(req, res) {
        try {
            const info = {
                maxFileSize: transactionFileService_1.default.getMaxFileSize(),
                allowedMimeTypes: transactionFileService_1.default.getAllowedMimeTypes(),
                allowedFileTypes: transactionFileService_1.default.getAllowedFileTypes(),
                maxFileSizeMB: Math.round(transactionFileService_1.default.getMaxFileSize() / 1024 / 1024),
            };
            res.json(info);
        }
        catch (error) {
            logger_1.default.error('Error getting file upload info', {
                error: error.message,
            });
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new TransactionFileController();
