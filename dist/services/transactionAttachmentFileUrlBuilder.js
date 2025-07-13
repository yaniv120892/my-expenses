"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionAttachmentFileUrlBuilder = transactionAttachmentFileUrlBuilder;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Client = new client_s3_1.S3Client({
    region: process.env.TRANSACTION_ATTACHMENT_S3_REGION,
    credentials: {
        accessKeyId: process.env.TRANSACTION_ATTACHMENT_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.TRANSACTION_ATTACHMENT_S3_SECRET_ACCESS_KEY,
    },
});
async function transactionAttachmentFileUrlBuilder(key, expiresInSeconds = 600) {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME,
        Key: key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: expiresInSeconds });
}
