"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionFileController = exports.GetPresignedUploadUrlRequest = exports.AttachFileRequest = void 0;
const transactionService_1 = __importDefault(require("../services/transactionService"));
const logger_1 = __importDefault(require("../utils/logger"));
class AttachFileRequest {
}
exports.AttachFileRequest = AttachFileRequest;
class GetPresignedUploadUrlRequest {
}
exports.GetPresignedUploadUrlRequest = GetPresignedUploadUrlRequest;
class TransactionFileController {
    async attachFile(transactionId, userId, data) {
        try {
            const { fileName, fileKey, fileSize, mimeType } = data;
            logger_1.default.debug('Start attaching file to transaction', {
                transactionId,
                userId,
                fileName,
                fileKey,
            });
            await transactionService_1.default.attachFile(transactionId, userId, {
                fileName,
                fileKey,
                fileSize,
                mimeType,
            });
            logger_1.default.debug('Done attaching file to transaction', {
                transactionId,
                userId,
                fileName,
                fileKey,
            });
            return { success: true };
        }
        catch (error) {
            logger_1.default.error('Failed to attach file to transaction', {
                transactionId,
                userId,
                fileName: data.fileName,
                fileKey: data.fileKey,
                error,
            });
            throw error;
        }
    }
    async getTransactionFiles(transactionId, userId) {
        try {
            logger_1.default.debug('Start getting transaction files', {
                transactionId,
                userId,
            });
            const files = await transactionService_1.default.getTransactionFiles(transactionId, userId);
            logger_1.default.debug('Done getting transaction files', {
                transactionId,
                userId,
                fileCount: files.length,
            });
            return files;
        }
        catch (error) {
            logger_1.default.error('Failed to get transaction files', {
                transactionId,
                userId,
                error,
            });
            throw error;
        }
    }
    async removeFile(transactionId, fileId, userId) {
        try {
            logger_1.default.debug('Start removing file from transaction', {
                transactionId,
                fileId,
                userId,
            });
            await transactionService_1.default.removeFile(transactionId, fileId, userId);
            logger_1.default.debug('Done removing file from transaction', {
                transactionId,
                fileId,
                userId,
            });
            return { success: true };
        }
        catch (error) {
            logger_1.default.error('Failed to remove file from transaction', {
                transactionId,
                fileId,
                userId,
                error,
            });
            throw error;
        }
    }
    async getPresignedUploadUrl(transactionId, userId, data) {
        const { fileName, mimeType } = data;
        try {
            logger_1.default.debug('Generating presigned S3 upload URL', {
                transactionId,
                userId,
                fileName,
                mimeType,
            });
            const result = await transactionService_1.default.getPresignedUploadUrl(transactionId, userId, fileName, mimeType);
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to generate presigned upload URL', {
                transactionId,
                userId,
                fileName,
                mimeType,
                error,
            });
            throw error;
        }
    }
}
exports.transactionFileController = new TransactionFileController();
