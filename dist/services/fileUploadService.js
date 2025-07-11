"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = require("crypto");
class FileUploadService {
    constructor() {
        this.bucketName = process.env.TRANSACTION_FILES_S3_BUCKET_NAME || process.env.IMPORTS_S3_BUCKET_NAME;
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
        this.allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
        ];
        this.allowedFileTypes = ['image', 'pdf'];
        this.s3Client = new client_s3_1.S3Client({
            credentials: {
                accessKeyId: process.env.IMPORTS_S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.IMPORTS_S3_SECRET_ACCESS_KEY,
            },
            region: process.env.IMPORTS_S3_REGION,
        });
    }
    async uploadTransactionFile(file, userId, transactionId) {
        this.validateFile(file);
        const fileName = this.generateFileName(file.originalname, userId, transactionId);
        const fileType = this.determineFileType(file.mimetype);
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await this.s3Client.send(putCommand);
        const fileUrl = `https://${this.bucketName}.s3.${process.env.IMPORTS_S3_REGION}.amazonaws.com/${fileName}`;
        return {
            fileName,
            originalName: file.originalname,
            fileUrl,
            fileType,
            fileSize: file.size,
            mimeType: file.mimetype,
        };
    }
    async deleteTransactionFile(fileUrl) {
        const fileName = this.extractFileNameFromUrl(fileUrl);
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
        });
        await this.s3Client.send(deleteCommand);
    }
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
        }
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }
    }
    generateFileName(originalName, userId, transactionId) {
        const extension = originalName.split('.').pop();
        const uniqueId = (0, crypto_1.randomUUID)();
        return `transactions/${userId}/${transactionId}/${uniqueId}.${extension}`;
    }
    determineFileType(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'image';
        }
        if (mimeType === 'application/pdf') {
            return 'pdf';
        }
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
    extractFileNameFromUrl(fileUrl) {
        const url = new URL(fileUrl);
        return decodeURIComponent(url.pathname.slice(1));
    }
    getMaxFileSize() {
        return this.maxFileSize;
    }
    getAllowedMimeTypes() {
        return this.allowedMimeTypes;
    }
    getAllowedFileTypes() {
        return this.allowedFileTypes;
    }
}
exports.default = new FileUploadService();
