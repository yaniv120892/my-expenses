"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importService = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const XLSX = __importStar(require("xlsx"));
const logger_1 = __importDefault(require("../utils/logger"));
const importRepository_1 = require("../repositories/importRepository");
const importedTransactionRepository_1 = require("../repositories/importedTransactionRepository");
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const transactionService_1 = __importDefault(require("./transactionService"));
const startProcessingRow = {
    [client_1.ImportFileType.CAL_CREDIT]: 5,
    [client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT]: 6,
    [client_1.ImportFileType.ISRACARD_CREDIT]: 6,
};
const skipLastRows = {
    [client_1.ImportFileType.CAL_CREDIT]: 3,
    [client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT]: 1,
    [client_1.ImportFileType.ISRACARD_CREDIT]: 1,
};
const headerRow = {
    [client_1.ImportFileType.CAL_CREDIT]: startProcessingRow[client_1.ImportFileType.CAL_CREDIT] - 1,
    [client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT]: startProcessingRow[client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT] - 1,
    [client_1.ImportFileType.ISRACARD_CREDIT]: startProcessingRow[client_1.ImportFileType.ISRACARD_CREDIT] - 1,
};
const ParsedTransactionFieldToColumnMap = {
    [client_1.ImportFileType.CAL_CREDIT]: {
        date: 0,
        description: 1,
        value: 2,
    },
    [client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT]: {
        date: 0,
        description: 2,
        value: 3,
    },
    [client_1.ImportFileType.ISRACARD_CREDIT]: {
        date: 0,
        description: 2,
        value: 3,
    },
};
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: process.env.IMPORTS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.IMPORTS_S3_SECRET_ACCESS_KEY,
    },
    region: process.env.IMPORTS_S3_REGION,
});
class ImportService {
    async processImport(fileUrl, importType, userId) {
        try {
            const importRecord = await importRepository_1.importRepository.create({
                fileUrl,
                importType,
                userId,
            });
            const s3Key = this.getS3KeyFromUrl(fileUrl);
            try {
                const workbook = await this.downloadAndParseFile(s3Key);
                const transactions = await this.processWorkbook(workbook, importType);
                const transactionsWithMatches = await this.findPotentialMatches(transactions, userId);
                await importedTransactionRepository_1.importedTransactionRepository.createMany(transactionsWithMatches.map((transaction) => (Object.assign(Object.assign({}, transaction), { importId: importRecord.id, userId }))));
                await importRepository_1.importRepository.updateStatus(importRecord.id, client_1.ImportStatus.COMPLETED);
                await this.deleteFileFromS3(s3Key);
                return importRecord;
            }
            catch (error) {
                await importRepository_1.importRepository.updateStatus(importRecord.id, client_1.ImportStatus.FAILED, error instanceof Error ? error.message : 'Unknown error occurred');
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error('Error processing import:', error);
            throw error;
        }
    }
    getS3KeyFromUrl(fileUrl) {
        const url = new URL(fileUrl);
        return decodeURIComponent(url.pathname.slice(1));
    }
    async downloadAndParseFile(s3Key) {
        var _a;
        try {
            const getObjectCommand = new client_s3_1.GetObjectCommand({
                Bucket: process.env.IMPORTS_S3_BUCKET_NAME,
                Key: s3Key,
            });
            const response = await s3Client.send(getObjectCommand);
            const arrayBuffer = await ((_a = response.Body) === null || _a === void 0 ? void 0 : _a.transformToByteArray());
            if (!arrayBuffer) {
                throw new Error('Failed to read file from S3');
            }
            return XLSX.read(arrayBuffer, { type: 'array' });
        }
        catch (error) {
            logger_1.default.error('Error downloading and parsing file:', error);
            throw error;
        }
    }
    async processWorkbook(workbook, importType) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: true,
        });
        return this.processRows(rows, importType);
    }
    processRows(rows, importType) {
        const transactions = [];
        const startRow = startProcessingRow[importType];
        const columnMap = ParsedTransactionFieldToColumnMap[importType];
        const lastRowsToSkip = skipLastRows[importType];
        const headers = this.extractHeaders(rows, headerRow[importType]);
        for (let i = startRow; i < rows.length - lastRowsToSkip; i++) {
            try {
                const currentRow = rows[i];
                this.validateRow(currentRow, importType);
                const date = this.validateAndParseDate(currentRow[columnMap.date], importType);
                const description = this.validateAndParseDescription(currentRow[columnMap.description], importType);
                const value = this.validateAndParseAmount(currentRow[columnMap.value], importType);
                const transactionType = value > 0 ? client_1.TransactionType.EXPENSE : client_1.TransactionType.INCOME;
                transactions.push({
                    date,
                    description,
                    value,
                    type: transactionType,
                    rawData: this.buildRawData(headers, currentRow),
                });
            }
            catch (error) {
                logger_1.default.error(`Error processing ${importType} row:`, {
                    error,
                    row: rows[i],
                    rowIndex: i + 1,
                });
                throw error;
            }
        }
        return transactions;
    }
    validateRow(row, importType) {
        if (!row) {
            throw new Error(`Invalid row: ${row}, importType: ${importType}`);
        }
        const columnMap = ParsedTransactionFieldToColumnMap[importType];
        if (!row[columnMap.date]) {
            throw new Error(`Invalid row: ${row}, importType: ${importType}, missing date column`);
        }
        if (!row[columnMap.description]) {
            throw new Error(`Invalid row: ${row}, importType: ${importType}, missing description column`);
        }
        if (!row[columnMap.value]) {
            throw new Error(`Invalid row: ${row}, importType: ${importType}, missing value column`);
        }
    }
    validateAndParseDate(dateValue, importType) {
        if (!dateValue) {
            throw new Error(`Invalid date value: ${dateValue}, importType: ${importType}`);
        }
        try {
            // If the date is a number (Excel serial date)
            if (!isNaN(Number(dateValue))) {
                const excelDate = Number(dateValue);
                // Convert Excel serial date to JavaScript Date
                // Excel's epoch starts from 1900-01-01, and we need to subtract 2 days due to Excel's leap year bug
                const date = new Date((excelDate - 25569) * 86400 * 1000);
                if (!date || isNaN(date.getTime())) {
                    throw new Error(`Invalid Excel date format: ${dateValue}`);
                }
                return date;
            }
            // If it's a string date in DD/MM/YY format
            const date = this.parseDate(dateValue);
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                throw new Error(`Invalid date format: ${dateValue}, importType: ${importType}`);
            }
            return date;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to parse date: ${dateValue}, importType: ${importType}, error: ${errorMessage}`);
        }
    }
    validateAndParseDescription(description, importType) {
        if (!description ||
            typeof description !== 'string' ||
            description.trim() === '') {
            throw new Error(`Invalid description: ${description}, importType: ${importType}`);
        }
        return description.trim();
    }
    validateAndParseAmount(amount, importType) {
        if (!amount) {
            throw new Error(`Invalid amount: ${amount}, importType: ${importType}`);
        }
        try {
            const cleanAmount = String(amount).replace(/[^\d.-]/g, '');
            const parsedAmount = parseFloat(cleanAmount);
            if (isNaN(parsedAmount)) {
                throw new Error(`Invalid amount format: ${amount}, importType: ${importType}`);
            }
            return Math.abs(parsedAmount);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to parse amount: ${amount}, importType: ${importType}, error: ${errorMessage}`);
        }
    }
    parseDate(dateStr) {
        try {
            const [day, month, year] = String(dateStr).split('/').map(Number);
            const date = new Date(2000 + year, month - 1, day);
            // Additional validation for the resulting date
            if (isNaN(date.getTime())) {
                throw new Error(`Invalid date components: day=${day}, month=${month}, year=${year}`);
            }
            return date;
        }
        catch (error) {
            logger_1.default.error('Error parsing date:', { dateStr, error });
            throw new Error(`Invalid date format: ${dateStr}`);
        }
    }
    async findPotentialMatches(transactions, userId) {
        return Promise.all(transactions.map(async (transaction) => {
            const matches = await transactionRepository_1.default.findPotentialMatches(userId, transaction.date, transaction.value);
            let matchingTransactionId = null;
            if (matches.length > 0) {
                const closestMatch = matches.reduce((closest, current) => {
                    return Math.abs(current.date.getTime() - transaction.date.getTime()) < Math.abs(closest.date.getTime() - transaction.date.getTime())
                        ? current
                        : closest;
                }, matches[0]);
                matchingTransactionId = closestMatch.id;
            }
            return Object.assign(Object.assign({}, transaction), { matchingTransactionId });
        }));
    }
    async deleteFileFromS3(s3Key) {
        try {
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: process.env.IMPORTS_S3_BUCKET_NAME,
                Key: s3Key,
            });
            await s3Client.send(deleteCommand);
        }
        catch (error) {
            logger_1.default.error('Error deleting file from S3:', error);
            throw error;
        }
    }
    async getImports(userId) {
        return importRepository_1.importRepository.findByUserId(userId);
    }
    async getImportedTransactions(importId, userId) {
        return importedTransactionRepository_1.importedTransactionRepository.findByUserIdAndImportId(userId, importId);
    }
    async approveImportedTransaction(importedTransactionId, userId) {
        const importedTransaction = await importedTransactionRepository_1.importedTransactionRepository.findById(importedTransactionId);
        if (!importedTransaction || importedTransaction.userId !== userId) {
            throw new Error('Imported transaction not found with id: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        await transactionService_1.default.createTransaction({
            description: importedTransaction.description,
            value: importedTransaction.value,
            date: importedTransaction.date,
            type: importedTransaction.type,
            userId: importedTransaction.userId,
            status: client_1.TransactionStatus.APPROVED,
            categoryId: null,
        });
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.APPROVED);
    }
    async mergeImportedTransaction(importedTransactionId, userId) {
        const importedTransaction = await importedTransactionRepository_1.importedTransactionRepository.findById(importedTransactionId);
        if (!importedTransaction || importedTransaction.userId !== userId) {
            throw new Error('Imported transaction not found with id: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        if (!importedTransaction.matchingTransactionId) {
            throw new Error('No matching transaction found to merge with; importedTransactionId: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        const matchingTransaction = await transactionRepository_1.default.getTransactionItem(importedTransaction.matchingTransactionId, userId);
        if (!matchingTransaction) {
            throw new Error('Matching transaction not found with id: ' +
                importedTransaction.matchingTransactionId +
                ' and userId: ' +
                userId);
        }
        await transactionService_1.default.updateTransaction(importedTransaction.matchingTransactionId, {
            description: matchingTransaction.description,
            type: matchingTransaction.type,
            value: Math.ceil(importedTransaction.value),
            date: importedTransaction.date,
        }, userId);
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.MERGED);
    }
    async rejectImportedTransaction(importedTransactionId, userId) {
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.IGNORED);
    }
    async deleteImportedTransaction(importedTransactionId, userId) {
        await importedTransactionRepository_1.importedTransactionRepository.softDelete(importedTransactionId, userId);
    }
    extractHeaders(rows, headerRowIndex) {
        const headerRow = rows[headerRowIndex];
        if (!headerRow) {
            throw new Error(`Header row not found at index ${headerRowIndex}`);
        }
        // Clean up headers: remove empty values and trim whitespace
        const headers = headerRow
            .map((header) => String(header || '')
            .replace(/\s+/g, ' ')
            .replace(/\r\n/g, ' ')
            .trim())
            .filter((header) => header !== '');
        if (headers.length === 0) {
            throw new Error('No valid headers found in header row');
        }
        return headers;
    }
    buildRawData(headers, row) {
        const rawData = {};
        headers.forEach((header, index) => {
            if (index < row.length) {
                const value = row[index];
                // Convert numeric strings to numbers
                rawData[header] = !isNaN(Number(value))
                    ? Number(value)
                    : String(value || '');
            }
        });
        return rawData;
    }
}
exports.importService = new ImportService();
