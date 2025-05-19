"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsStorageProvider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
class AwsStorageProvider {
    constructor() {
        this.bucketName = process.env.BACKUP_S3_BUCKET_NAME;
        const region = process.env.BACKUP_S3_REGION;
        this.s3Client = new client_s3_1.S3Client({
            region: region,
            forcePathStyle: false,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadBackup(fileName, fileContent, mimeType) {
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: fileContent,
            ContentType: mimeType,
        });
        await this.s3Client.send(putCommand);
        const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        return url;
    }
}
exports.AwsStorageProvider = AwsStorageProvider;
