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
const aiServiceFactory_1 = __importDefault(require("../services/ai/aiServiceFactory"));
const startProcessingRow = {
    [client_1.ImportBankSourceType.BANK_CREDIT]: 5,
    [client_1.ImportBankSourceType.NON_BANK_CREDIT]: 6,
};
const skipLastRows = {
    [client_1.ImportBankSourceType.BANK_CREDIT]: 3,
    [client_1.ImportBankSourceType.NON_BANK_CREDIT]: 1,
};
const headerRow = {
    [client_1.ImportBankSourceType.BANK_CREDIT]: startProcessingRow[client_1.ImportBankSourceType.BANK_CREDIT] - 1,
    [client_1.ImportBankSourceType.NON_BANK_CREDIT]: startProcessingRow[client_1.ImportBankSourceType.NON_BANK_CREDIT] - 1,
};
const ParsedTransactionFieldToColumnMap = {
    [client_1.ImportBankSourceType.BANK_CREDIT]: {
        date: 0,
        description: 1,
        value: 2,
    },
    [client_1.ImportBankSourceType.NON_BANK_CREDIT]: {
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
    constructor() {
        this.aiProvider = aiServiceFactory_1.default.getAIService();
        this.creditCardPatterns = [
            /ב-(\d{4})/,
            /- (\d{4})/,
            /כרטיס \*(\d{4})/,
            /\*(\d{4})$/,
            /(\d{4})$/,
        ];
        this.paymentMonthFileNamePattern = /^(\d{4})_(\d{2})_(\d{4})(\.\w+)?$/;
        this.creditCardLastFourFileNamePattern = /^(\d{4})_(\d{2})_(\d{4})(\.\w+)?$/;
    }
    async processImport(fileUrl, userId, originalFileName, paymentMonthFromRequest) {
        let importRecord;
        const s3Key = this.getS3KeyFromUrl(fileUrl);
        try {
            const workbook = await this.downloadAndParseFile(s3Key);
            const firstSheetName = workbook.SheetNames[0];
            const firstSheet = workbook.Sheets[firstSheetName];
            const inferredImportType = await this.inferImportFileType(firstSheet, originalFileName);
            const inferredBankSourceType = await this.inferBankSourceType(firstSheet, originalFileName);
            const creditCardLastFour = await this.extractCreditCardLastFour(firstSheet, originalFileName);
            const paymentMonth = paymentMonthFromRequest || this.determinePaymentMonth(firstSheet, originalFileName);
            logger_1.default.debug('Inferred import details', { inferredImportType, inferredBankSourceType, creditCardLastFour, paymentMonth });
            importRecord = await importRepository_1.importRepository.create({
                fileUrl,
                originalFileName,
                importType: inferredImportType,
                bankSourceType: inferredBankSourceType,
                userId,
                creditCardLastFourDigits: creditCardLastFour,
                paymentMonth: paymentMonth,
            });
            if (!importRecord) {
                logger_1.default.error('Import record was not created successfully before processing transactions.');
                throw new Error('Failed to create import record.');
            }
            try {
                const transactions = await this.processWorkbook(workbook, inferredBankSourceType);
                const currentImportId = importRecord.id;
                const transactionsWithMatches = await this.findPotentialMatches(transactions, userId);
                await importedTransactionRepository_1.importedTransactionRepository.createMany(transactionsWithMatches.map((transaction) => (Object.assign(Object.assign({}, transaction), { importId: currentImportId, userId }))));
                await importRepository_1.importRepository.updateStatus(currentImportId, client_1.ImportStatus.COMPLETED);
                await this.deleteFileFromS3(s3Key);
                return importRecord;
            }
            catch (error) {
                if (importRecord && importRecord.id) {
                    await importRepository_1.importRepository.updateStatus(importRecord.id, client_1.ImportStatus.FAILED, error instanceof Error ? error.message : 'Unknown error occurred');
                }
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
    async processWorkbook(workbook, bankSourceType) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: true,
        });
        return this.processRows(rows, bankSourceType);
    }
    processRows(rows, bankSourceType) {
        const transactions = [];
        const startRow = startProcessingRow[bankSourceType];
        const columnMap = ParsedTransactionFieldToColumnMap[bankSourceType];
        const lastRowsToSkip = skipLastRows[bankSourceType];
        const headers = this.extractHeaders(rows, headerRow[bankSourceType]);
        for (let i = startRow; i < rows.length - lastRowsToSkip; i++) {
            try {
                const currentRow = rows[i];
                this.validateRow(currentRow, bankSourceType);
                const date = this.validateAndParseDate(currentRow[columnMap.date], bankSourceType);
                const description = this.validateAndParseDescription(currentRow[columnMap.description], bankSourceType);
                const value = this.validateAndParseAmount(currentRow[columnMap.value], bankSourceType);
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
                logger_1.default.error(`Error processing ${bankSourceType} row:`, {
                    error,
                    row: rows[i],
                    rowIndex: i + 1,
                });
                throw error;
            }
        }
        return transactions;
    }
    validateRow(row, bankSourceType) {
        if (!row) {
            throw new Error(`Invalid row: ${row}, bankSourceType: ${bankSourceType}`);
        }
        const columnMap = ParsedTransactionFieldToColumnMap[bankSourceType];
        if (!row[columnMap.date]) {
            throw new Error(`Invalid row: ${row}, bankSourceType: ${bankSourceType}, missing date column`);
        }
        if (!row[columnMap.description]) {
            throw new Error(`Invalid row: ${row}, bankSourceType: ${bankSourceType}, missing description column`);
        }
        if (!row[columnMap.value]) {
            throw new Error(`Invalid row: ${row}, bankSourceType: ${bankSourceType}, missing value column`);
        }
    }
    validateAndParseDate(dateValue, bankSourceType) {
        if (!dateValue) {
            throw new Error(`Invalid date value: ${dateValue}, bankSourceType: ${bankSourceType}`);
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
            // If it's a string date in DD/MM/YYYY format
            const date = this.parseDate(dateValue);
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                throw new Error(`Invalid date format: ${dateValue}, bankSourceType: ${bankSourceType}`);
            }
            return date;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to parse date: ${dateValue}, bankSourceType: ${bankSourceType}, error: ${errorMessage}`);
        }
    }
    validateAndParseDescription(description, bankSourceType) {
        if (!description ||
            typeof description !== 'string' ||
            description.trim() === '') {
            throw new Error(`Invalid description: ${description}, bankSourceType: ${bankSourceType}`);
        }
        return description.trim();
    }
    validateAndParseAmount(amount, bankSourceType) {
        if (!amount) {
            throw new Error(`Invalid amount: ${amount}, bankSourceType: ${bankSourceType}`);
        }
        try {
            const cleanAmount = String(amount).replace(/[^\d.-]/g, '');
            const parsedAmount = parseFloat(cleanAmount);
            if (isNaN(parsedAmount)) {
                throw new Error(`Invalid amount format: ${amount}, bankSourceType: ${bankSourceType}`);
            }
            return Math.abs(parsedAmount);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to parse amount: ${amount}, bankSourceType: ${bankSourceType}, error: ${errorMessage}`);
        }
    }
    parseDate(dateStr) {
        try {
            const [day, month, year] = String(dateStr).split('/').map(Number);
            const date = new Date(year, month - 1, day);
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
            var _a, _b;
            const matches = await transactionRepository_1.default.findPotentialMatches(userId, transaction.date, transaction.value);
            let matchingTransactionId = null;
            if (matches.length > 0) {
                const bestMatchId = await this.aiProvider.findMatchingTransaction(transaction.description, matches);
                matchingTransactionId = (_b = bestMatchId !== null && bestMatchId !== void 0 ? bestMatchId : (_a = matches[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
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
    async approveImportedTransaction(importedTransactionId, userId, transactionData) {
        const importedTransaction = await importedTransactionRepository_1.importedTransactionRepository.findById(importedTransactionId);
        if (!importedTransaction || importedTransaction.userId !== userId) {
            throw new Error('Imported transaction not found with id: ' +
                importedTransactionId +
                ' and userId: ' +
                userId);
        }
        await transactionService_1.default.createTransaction({
            description: transactionData.description,
            value: transactionData.value,
            date: transactionData.date,
            type: transactionData.type,
            userId: importedTransaction.userId,
            status: client_1.TransactionStatus.APPROVED,
            categoryId: transactionData.categoryId,
        });
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.APPROVED);
    }
    async mergeImportedTransaction(importedTransactionId, userId, transactionData) {
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
            description: transactionData.description,
            type: transactionData.type,
            value: transactionData.value,
            date: transactionData.date,
            categoryId: transactionData.categoryId,
        }, userId);
        await importedTransactionRepository_1.importedTransactionRepository.updateStatus(importedTransactionId, userId, client_1.ImportedTransactionStatus.MERGED);
    }
    async ignoreImportedTransaction(importedTransactionId, userId) {
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
    async extractCreditCardLastFour(firstSheet, originalFileName) {
        try {
            const creditCardLastFour = this.determineCreditCardLastFour(originalFileName);
            if (creditCardLastFour) {
                return creditCardLastFour;
            }
            if (!firstSheet) {
                throw new Error('First sheet not found');
            }
            const cellA1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
            const cellA1 = firstSheet[cellA1Ref];
            const cellA1Value = cellA1 && cellA1.v ? String(cellA1.v) : null;
            if (cellA1Value) {
                for (const pattern of this.creditCardPatterns) {
                    const match = cellA1Value.match(pattern);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
            }
            throw new Error('Credit card last four digits not found');
        }
        catch (error) {
            logger_1.default.error('Failed to extract credit card last four digits', { error });
            throw error;
        }
    }
    determinePaymentMonth(firstSheet, originalFileName) {
        try {
            const fileNameMatch = originalFileName.match(this.paymentMonthFileNamePattern);
            if (fileNameMatch && fileNameMatch[2] && fileNameMatch[3]) {
                return `${fileNameMatch[2]}/${fileNameMatch[3]}`;
            }
            const cellA3Ref = XLSX.utils.encode_cell({ r: 2, c: 0 });
            const cellA3 = firstSheet[cellA3Ref];
            const cellA3Value = cellA3 && cellA3.v ? String(cellA3.v) : null;
            if (cellA3Value) {
                const match = cellA3Value.match(/(\d{2})\/(\d{4})/);
                if (match && match[1] && match[2]) {
                    return `${match[1]}/${match[2]}`;
                }
            }
            throw new Error('Payment month not found');
        }
        catch (error) {
            logger_1.default.error('Failed to determine payment month', { error });
            throw error;
        }
    }
    determineCreditCardLastFour(originalFileName) {
        try {
            const fileNameMatch = originalFileName.match(this.creditCardLastFourFileNamePattern);
            if (fileNameMatch && fileNameMatch[1]) {
                return fileNameMatch[1];
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to determine credit card last four digits', { error });
            throw error;
        }
    }
    async inferImportFileType(firstSheet, originalFileName) {
        const cellA4Ref = XLSX.utils.encode_cell({ r: 3, c: 0 });
        const cellA4 = firstSheet ? firstSheet[cellA4Ref] : null;
        const cellA4Value = cellA4 && cellA4.v ? String(cellA4.v).toLowerCase() : null;
        const cellA1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
        const cellA1 = firstSheet ? firstSheet[cellA1Ref] : null;
        const cellA1Value = cellA1 && cellA1.v ? String(cellA1.v).toLowerCase() : null;
        if (cellA4Value) {
            if (cellA4Value.includes('american express') || cellA4Value.includes('אמריקן אקספרס')) {
                return client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT;
            }
            if (cellA4Value.includes('mastercard') || cellA4Value.includes('מסטרקארד')) {
                return client_1.ImportFileType.MASTERCARD_CREDIT;
            }
            if (cellA4Value.includes('cal') || cellA4Value.includes('כאל')) {
                return client_1.ImportFileType.VISA_CREDIT;
            }
        }
        if (cellA1Value) {
            if (cellA1Value.includes('american express') || cellA1Value.includes('אמריקן אקספרס')) {
                return client_1.ImportFileType.AMERICAN_EXPRESS_CREDIT;
            }
            if (cellA1Value.includes('mastercard') || cellA1Value.includes('מאסטרקארד')) {
                return client_1.ImportFileType.MASTERCARD_CREDIT;
            }
            if (cellA1Value.includes('visa') || cellA1Value.includes('ויזה')) {
                return client_1.ImportFileType.VISA_CREDIT;
            }
        }
        logger_1.default.error(`Could not infer import file type for ${originalFileName}. Cell A1 or A4 content did not match known patterns.`);
        throw new Error(`Unable to determine import file type for ${originalFileName}. Please ensure the file format is supported.`);
    }
    async inferBankSourceType(firstSheet, originalFileName) {
        const cellA1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
        const cellA1 = firstSheet ? firstSheet[cellA1Ref] : null;
        const cellA1Value = cellA1 && cellA1.v ? String(cellA1.v).toLowerCase() : null;
        if (cellA1Value) {
            if (cellA1Value.includes('פירוט עסקאות לחשבון')) {
                return client_1.ImportBankSourceType.BANK_CREDIT;
            }
            return client_1.ImportBankSourceType.NON_BANK_CREDIT;
        }
        logger_1.default.error(`Could not infer import file type for ${originalFileName}. Cell A1 or A4 content did not match known patterns.`);
        throw new Error(`Unable to determine import file type for ${originalFileName}. Please ensure the file format is supported.`);
    }
}
exports.importService = new ImportService();
