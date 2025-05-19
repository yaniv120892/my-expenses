import { BackupStorageProvider } from './backupStorageProvider';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class AwsStorageProvider implements BackupStorageProvider {
  private s3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.BACKUP_S3_BUCKET_NAME as string;
    const region = process.env.BACKUP_S3_REGION as string;
    this.s3Client = new S3Client({
      region: region,
      forcePathStyle: false,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async uploadBackup(
    fileName: string,
    fileContent: Buffer,
    mimeType: string,
  ): Promise<string> {
    const putCommand = new PutObjectCommand({
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
