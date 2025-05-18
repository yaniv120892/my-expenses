import { BackupStorageProvider } from './backupStorageProvider';
import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleStorageProvider implements BackupStorageProvider {
  private drive;
  private folderId: string;

  constructor() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(
      /\\n/g,
      '\n',
    );
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID as string;
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadBackup(
    fileName: string,
    fileContent: Buffer,
    mimeType: string,
  ): Promise<string> {
    const fileMetadata = {
      name: fileName,
      parents: [this.folderId],
    };
    const streamFromBuffer = (buffer: Buffer) => {
      const readable = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });
      return readable;
    };
    const media = {
      mimeType,
      body: streamFromBuffer(fileContent),
    };
    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });
    return res.data.webViewLink || '';
  }
}
