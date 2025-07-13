import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.TRANSACTION_ATTACHMENT_S3_REGION,
  credentials: {
    accessKeyId: process.env.TRANSACTION_ATTACHMENT_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TRANSACTION_ATTACHMENT_S3_SECRET_ACCESS_KEY!,
  },
});

export async function transactionAttachmentFileUrlBuilder(
  key: string,
  expiresInSeconds = 600,
) {
  const command = new GetObjectCommand({
    Bucket: process.env.TRANSACTION_ATTACHMENT_S3_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
