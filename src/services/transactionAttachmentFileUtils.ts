import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.TRANSACTION_ATTACHMENT_S3_REGION,
  credentials: {
    accessKeyId: process.env.TRANSACTION_ATTACHMENT_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TRANSACTION_ATTACHMENT_S3_SECRET_ACCESS_KEY!,
  },
});

export async function buildPreviewUrl(key: string, expiresInSeconds = 600) {
  const command = new GetObjectCommand({
    Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function buildDownloadUrl(
  key: string,
  filename: string,
  expiresInSeconds = 600,
) {
  const command = new GetObjectCommand({
    Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME!,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedUploadUrl(
  transactionId: string,
  fileName: string,
  mimeType: string,
  expiresInSeconds = 600,
) {
  const ext = fileName.split('.').pop();
  const baseName = fileName.replace(`.${ext}`, '');
  const fileKey = `transactions/${transactionId}/${uuidv4()}-${baseName}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME!,
    Key: fileKey,
    ContentType: mimeType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });
  return { uploadUrl, fileKey };
}
