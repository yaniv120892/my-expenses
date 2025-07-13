"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPreviewUrl = buildPreviewUrl;
exports.buildDownloadUrl = buildDownloadUrl;
exports.getPresignedUploadUrl = getPresignedUploadUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const s3Client = new client_s3_1.S3Client({
    region: process.env.TRANSACTION_ATTACHMENT_S3_REGION,
    credentials: {
        accessKeyId: process.env.TRANSACTION_ATTACHMENT_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.TRANSACTION_ATTACHMENT_S3_SECRET_ACCESS_KEY,
    },
});
async function buildPreviewUrl(key, expiresInSeconds = 600) {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME,
        Key: key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: expiresInSeconds });
}
async function buildDownloadUrl(key, filename, expiresInSeconds = 600) {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: expiresInSeconds });
}
async function getPresignedUploadUrl(transactionId, fileName, mimeType, expiresInSeconds = 600) {
    const ext = fileName.split('.').pop();
    const baseName = fileName.replace(`.${ext}`, '');
    const fileKey = `transactions/${transactionId}/${(0, uuid_1.v4)()}-${baseName}.${ext}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME,
        Key: fileKey,
        ContentType: mimeType,
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
        expiresIn: expiresInSeconds,
    });
    return { uploadUrl, fileKey };
}
