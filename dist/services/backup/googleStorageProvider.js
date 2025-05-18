"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleStorageProvider = void 0;
const googleapis_1 = require("googleapis");
const stream_1 = require("stream");
class GoogleStorageProvider {
    constructor() {
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const auth = new googleapis_1.google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        this.drive = googleapis_1.google.drive({ version: 'v3', auth });
    }
    async uploadBackup(fileName, fileContent, mimeType) {
        const fileMetadata = {
            name: fileName,
            parents: [this.folderId],
        };
        const streamFromBuffer = (buffer) => {
            const readable = new stream_1.Readable({
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
exports.GoogleStorageProvider = GoogleStorageProvider;
