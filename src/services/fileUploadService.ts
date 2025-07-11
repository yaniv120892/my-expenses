import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

export interface FileUploadResult {
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private allowedFileTypes: string[];

  constructor() {
    this.bucketName = process.env.TRANSACTION_FILES_S3_BUCKET_NAME || process.env.IMPORTS_S3_BUCKET_NAME as string;
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
    
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.IMPORTS_S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.IMPORTS_S3_SECRET_ACCESS_KEY as string,
      },
      region: process.env.IMPORTS_S3_REGION,
    });
  }

  public async uploadTransactionFile(
    file: UploadFile,
    userId: string,
    transactionId: string
  ): Promise<FileUploadResult> {
    this.validateFile(file);
    
    const fileName = this.generateFileName(file.originalname, userId, transactionId);
    const fileType = this.determineFileType(file.mimetype);
    
    const putCommand = new PutObjectCommand({
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

  public async deleteTransactionFile(fileUrl: string): Promise<void> {
    const fileName = this.extractFileNameFromUrl(fileUrl);
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });
    
    await this.s3Client.send(deleteCommand);
  }

  private validateFile(file: UploadFile): void {
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

  private generateFileName(originalName: string, userId: string, transactionId: string): string {
    const extension = originalName.split('.').pop();
    const uniqueId = randomUUID();
    return `transactions/${userId}/${transactionId}/${uniqueId}.${extension}`;
  }

  private determineFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  private extractFileNameFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.slice(1));
  }

  public getMaxFileSize(): number {
    return this.maxFileSize;
  }

  public getAllowedMimeTypes(): string[] {
    return this.allowedMimeTypes;
  }

  public getAllowedFileTypes(): string[] {
    return this.allowedFileTypes;
  }
}

export default new FileUploadService();