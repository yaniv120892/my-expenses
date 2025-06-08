import {
  Import,
  ImportStatus,
  ImportFileType,
  TransactionType,
  TransactionStatus,
  ImportedTransactionStatus,
} from '@prisma/client';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as XLSX from 'xlsx';
import logger from '../utils/logger';
import { importRepository } from '../repositories/importRepository';
import { importedTransactionRepository } from '../repositories/importedTransactionRepository';
import transactionRepository from '../repositories/transactionRepository';
import transactionService from './transactionService';
import AIServiceFactory from '../services/ai/aiServiceFactory';

const startProcessingRow = {
  [ImportFileType.VISA_CREDIT]: 5,
  [ImportFileType.AMERICAN_EXPRESS_CREDIT]: 6,
  [ImportFileType.MASTERCARD_CREDIT]: 6,
};

const skipLastRows = {
  [ImportFileType.VISA_CREDIT]: 3,
  [ImportFileType.AMERICAN_EXPRESS_CREDIT]: 1,
  [ImportFileType.MASTERCARD_CREDIT]: 1,
};

const headerRow = {
  [ImportFileType.VISA_CREDIT]:
    startProcessingRow[ImportFileType.VISA_CREDIT] - 1,
  [ImportFileType.AMERICAN_EXPRESS_CREDIT]:
    startProcessingRow[ImportFileType.AMERICAN_EXPRESS_CREDIT] - 1,
  [ImportFileType.MASTERCARD_CREDIT]:
    startProcessingRow[ImportFileType.MASTERCARD_CREDIT] - 1,
};

const ParsedTransactionFieldToColumnMap = {
  [ImportFileType.VISA_CREDIT]: {
    date: 0,
    description: 1,
    value: 2,
  },
  [ImportFileType.AMERICAN_EXPRESS_CREDIT]: {
    date: 0,
    description: 2,
    value: 3,
  },
  [ImportFileType.MASTERCARD_CREDIT]: {
    date: 0,
    description: 2,
    value: 3,
  },
};

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.IMPORTS_S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.IMPORTS_S3_SECRET_ACCESS_KEY as string,
  },
  region: process.env.IMPORTS_S3_REGION,
});

interface ParsedTransaction {
  date: Date;
  description: string;
  value: number;
  type: TransactionType;
  rawData: Record<string, string | number>;
}

interface ApproveImportedTransactionData {
  description: string;
  value: number;
  date: Date;
  type: TransactionType;
  categoryId: string | null;
}

interface MergeImportedTransactionData {
  description: string;
  value: number;
  date: Date;
  type: TransactionType;
  categoryId: string;
}

class ImportService {
  private aiProvider = AIServiceFactory.getAIService();

  public async processImport(
    fileUrl: string,
    userId: string,
    originalFileName: string,
    paymentMonthFromRequest?: string,
  ) {
    let importRecord: Import | undefined;
    const s3Key = this.getS3KeyFromUrl(fileUrl);
    try {
      const workbook = await this.downloadAndParseFile(s3Key);
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];

      const inferredImportType = await this.inferImportFileType(firstSheet, originalFileName);
      const creditCardLastFour = await this.extractCreditCardLastFour(firstSheet, originalFileName);
      const paymentMonth = paymentMonthFromRequest || this.determinePaymentMonth(firstSheet, originalFileName);

      logger.debug('Inferred import details', { inferredImportType, creditCardLastFour, paymentMonth });

      importRecord = await importRepository.create({
        fileUrl,
        originalFileName,
        importType: inferredImportType,
        userId,
        creditCardLastFourDigits: creditCardLastFour,
        paymentMonth: paymentMonth,
      });

      if (!importRecord) {
        logger.error('Import record was not created successfully before processing transactions.');
        throw new Error('Failed to create import record.');
      }

      try {
        const transactions = await this.processWorkbook(workbook, inferredImportType);

        const currentImportId = importRecord.id;

        const transactionsWithMatches = await this.findPotentialMatches(
          transactions,
          userId,
        );

        await importedTransactionRepository.createMany(
          transactionsWithMatches.map((transaction) => ({
            ...transaction,
            importId: currentImportId,
            userId,
          })),
        );

        await importRepository.updateStatus(
          currentImportId,
          ImportStatus.COMPLETED,
        );

        await this.deleteFileFromS3(s3Key);

        return importRecord;
      } catch (error) {
        if (importRecord && importRecord.id) {
          await importRepository.updateStatus(
            importRecord.id,
            ImportStatus.FAILED,
            error instanceof Error ? error.message : 'Unknown error occurred',
          );
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error processing import:', error);
      throw error;
    }
  }

  private getS3KeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.slice(1));
  }

  private async downloadAndParseFile(s3Key: string) {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.IMPORTS_S3_BUCKET_NAME,
        Key: s3Key,
      });

      const response = await s3Client.send(getObjectCommand);
      const arrayBuffer = await response.Body?.transformToByteArray();

      if (!arrayBuffer) {
        throw new Error('Failed to read file from S3');
      }

      return XLSX.read(arrayBuffer, { type: 'array' });
    } catch (error) {
      logger.error('Error downloading and parsing file:', error);
      throw error;
    }
  }

  private async processWorkbook(
    workbook: XLSX.WorkBook,
    importType: ImportFileType,
  ): Promise<ParsedTransaction[]> {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
    }) as string[][];
    return this.processRows(rows, importType);
  }

  private processRows(
    rows: string[][],
    importType: ImportFileType,
  ): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const startRow = startProcessingRow[importType];
    const columnMap = ParsedTransactionFieldToColumnMap[importType];
    const lastRowsToSkip = skipLastRows[importType];
    const headers = this.extractHeaders(rows, headerRow[importType]);

    for (let i = startRow; i < rows.length - lastRowsToSkip; i++) {
      try {
        const currentRow = rows[i];
        this.validateRow(currentRow, importType);

        const date = this.validateAndParseDate(
          currentRow[columnMap.date],
          importType,
        );
        const description = this.validateAndParseDescription(
          currentRow[columnMap.description],
          importType,
        );
        const value = this.validateAndParseAmount(
          currentRow[columnMap.value],
          importType,
        );

        const transactionType =
          value > 0 ? TransactionType.EXPENSE : TransactionType.INCOME;

        transactions.push({
          date,
          description,
          value,
          type: transactionType,
          rawData: this.buildRawData(headers, currentRow),
        });
      } catch (error) {
        logger.error(`Error processing ${importType} row:`, {
          error,
          row: rows[i],
          rowIndex: i + 1,
        });
        throw error;
      }
    }

    return transactions;
  }

  private validateRow(row: string[], importType: ImportFileType) {
    if (!row) {
      throw new Error(`Invalid row: ${row}, importType: ${importType}`);
    }

    const columnMap = ParsedTransactionFieldToColumnMap[importType];

    if (!row[columnMap.date]) {
      throw new Error(
        `Invalid row: ${row}, importType: ${importType}, missing date column`,
      );
    }

    if (!row[columnMap.description]) {
      throw new Error(
        `Invalid row: ${row}, importType: ${importType}, missing description column`,
      );
    }

    if (!row[columnMap.value]) {
      throw new Error(
        `Invalid row: ${row}, importType: ${importType}, missing value column`,
      );
    }
  }

  private validateAndParseDate(
    dateValue: string,
    importType: ImportFileType,
  ): Date {
    if (!dateValue) {
      throw new Error(
        `Invalid date value: ${dateValue}, importType: ${importType}`,
      );
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
        throw new Error(
          `Invalid date format: ${dateValue}, importType: ${importType}`,
        );
      }
      return date;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to parse date: ${dateValue}, importType: ${importType}, error: ${errorMessage}`,
      );
    }
  }

  private validateAndParseDescription(
    description: string,
    importType: ImportFileType,
  ): string {
    if (
      !description ||
      typeof description !== 'string' ||
      description.trim() === ''
    ) {
      throw new Error(
        `Invalid description: ${description}, importType: ${importType}`,
      );
    }
    return description.trim();
  }

  private validateAndParseAmount(
    amount: string,
    importType: ImportFileType,
  ): number {
    if (!amount) {
      throw new Error(`Invalid amount: ${amount}, importType: ${importType}`);
    }

    try {
      const cleanAmount = String(amount).replace(/[^\d.-]/g, '');
      const parsedAmount = parseFloat(cleanAmount);

      if (isNaN(parsedAmount)) {
        throw new Error(
          `Invalid amount format: ${amount}, importType: ${importType}`,
        );
      }

      return Math.abs(parsedAmount);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to parse amount: ${amount}, importType: ${importType}, error: ${errorMessage}`,
      );
    }
  }

  private parseDate(dateStr: string): Date {
    try {
      const [day, month, year] = String(dateStr).split('/').map(Number);
      const date = new Date(year, month - 1, day);

      // Additional validation for the resulting date
      if (isNaN(date.getTime())) {
        throw new Error(
          `Invalid date components: day=${day}, month=${month}, year=${year}`,
        );
      }

      return date;
    } catch (error) {
      logger.error('Error parsing date:', { dateStr, error });
      throw new Error(`Invalid date format: ${dateStr}`);
    }
  }

  private async findPotentialMatches(
    transactions: ParsedTransaction[],
    userId: string,
  ) {
    return Promise.all(
      transactions.map(async (transaction) => {
        const matches = await transactionRepository.findPotentialMatches(
          userId,
          transaction.date,
          transaction.value,
        );

        let matchingTransactionId = null;
        if (matches.length > 0) {
          const bestMatchId = await this.aiProvider.findMatchingTransaction(
            transaction.description,
            matches,
          );

          matchingTransactionId = bestMatchId ?? matches[0]?.id ?? null;
        }

        return {
          ...transaction,
          matchingTransactionId,
        };
      }),
    );
  }

  private async deleteFileFromS3(s3Key: string) {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.IMPORTS_S3_BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(deleteCommand);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  public async getImports(userId: string) {
    return importRepository.findByUserId(userId);
  }

  public async getImportedTransactions(importId: string, userId: string) {
    return importedTransactionRepository.findByUserIdAndImportId(
      userId,
      importId,
    );
  }

  public async approveImportedTransaction(
    importedTransactionId: string,
    userId: string,
    transactionData: ApproveImportedTransactionData,
  ) {
    const importedTransaction = await importedTransactionRepository.findById(
      importedTransactionId,
    );

    if (!importedTransaction || importedTransaction.userId !== userId) {
      throw new Error(
        'Imported transaction not found with id: ' +
          importedTransactionId +
          ' and userId: ' +
          userId,
      );
    }

    await transactionService.createTransaction({
      description: transactionData.description,
      value: transactionData.value,
      date: transactionData.date,
      type: transactionData.type,
      userId: importedTransaction.userId,
      status: TransactionStatus.APPROVED,
      categoryId: transactionData.categoryId,
    });

    await importedTransactionRepository.updateStatus(
      importedTransactionId,
      userId,
      ImportedTransactionStatus.APPROVED,
    );
  }

  public async mergeImportedTransaction(
    importedTransactionId: string,
    userId: string,
    transactionData: MergeImportedTransactionData,
  ) {
    const importedTransaction = await importedTransactionRepository.findById(
      importedTransactionId,
    );

    if (!importedTransaction || importedTransaction.userId !== userId) {
      throw new Error(
        'Imported transaction not found with id: ' +
          importedTransactionId +
          ' and userId: ' +
          userId,
      );
    }

    if (!importedTransaction.matchingTransactionId) {
      throw new Error(
        'No matching transaction found to merge with; importedTransactionId: ' +
          importedTransactionId +
          ' and userId: ' +
          userId,
      );
    }

    const matchingTransaction = await transactionRepository.getTransactionItem(
      importedTransaction.matchingTransactionId,
      userId,
    );

    if (!matchingTransaction) {
      throw new Error(
        'Matching transaction not found with id: ' +
          importedTransaction.matchingTransactionId +
          ' and userId: ' +
          userId,
      );
    }

    await transactionService.updateTransaction(
      importedTransaction.matchingTransactionId,
      {
        description: transactionData.description,
        type: transactionData.type,
        value: transactionData.value,
        date: transactionData.date,
        categoryId: transactionData.categoryId,
      },
      userId,
    );

    await importedTransactionRepository.updateStatus(
      importedTransactionId,
      userId,
      ImportedTransactionStatus.MERGED,
    );
  }

  public async ignoreImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    await importedTransactionRepository.updateStatus(
      importedTransactionId,
      userId,
      ImportedTransactionStatus.IGNORED,
    );
  }

  public async deleteImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    await importedTransactionRepository.softDelete(
      importedTransactionId,
      userId,
    );
  }

  private extractHeaders(rows: string[][], headerRowIndex: number): string[] {
    const headerRow = rows[headerRowIndex];
    if (!headerRow) {
      throw new Error(`Header row not found at index ${headerRowIndex}`);
    }

    // Clean up headers: remove empty values and trim whitespace
    const headers = headerRow
      .map((header) =>
        String(header || '')
          .replace(/\s+/g, ' ')
          .replace(/\r\n/g, ' ')
          .trim(),
      )
      .filter((header) => header !== '');

    if (headers.length === 0) {
      throw new Error('No valid headers found in header row');
    }

    return headers;
  }

  private buildRawData(
    headers: string[],
    row: string[],
  ): Record<string, string | number> {
    const rawData: Record<string, string | number> = {};

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

  private creditCardPatterns = [
    /ב-(\d{4})/,
    /- (\d{4})/,
    /כרטיס \*(\d{4})/,
    /\*(\d{4})$/,
    /(\d{4})$/,
  ];

  private paymentMonthFileNamePattern = /^(\d{4})_(\d{2})_(\d{4})(\.\w+)?$/;
  private creditCardLastFourFileNamePattern = /^(\d{4})_(\d{2})_(\d{4})(\.\w+)?$/;

  private async extractCreditCardLastFour(firstSheet: XLSX.WorkSheet, originalFileName: string): Promise<string> {
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
    } catch (error) {
      logger.error('Failed to extract credit card last four digits', { error });
      throw error;
    }
  }

  private determinePaymentMonth(firstSheet: XLSX.WorkSheet, originalFileName: string): string {
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
    } catch (error) {
      logger.error('Failed to determine payment month', { error });
      throw error;
    }
  }

  private determineCreditCardLastFour(originalFileName: string): string | null {
    try {
    const fileNameMatch = originalFileName.match(this.creditCardLastFourFileNamePattern);
    if (fileNameMatch && fileNameMatch[1]) {
      return fileNameMatch[1];
    }
    return null;
    } catch (error) {
      logger.error('Failed to determine credit card last four digits', { error });
      throw error;
    }
  }

  private async inferImportFileType(
    firstSheet: XLSX.WorkSheet,
    originalFileName: string,
  ): Promise<ImportFileType> {
    const cellA4Ref = XLSX.utils.encode_cell({ r: 3, c: 0 });
    const cellA4 = firstSheet ? firstSheet[cellA4Ref] : null;
    const cellA4Value = cellA4 && cellA4.v ? String(cellA4.v).toLowerCase() : null;

    const cellA1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
    const cellA1 = firstSheet ? firstSheet[cellA1Ref] : null;
    const cellA1Value = cellA1 && cellA1.v ? String(cellA1.v).toLowerCase() : null;

    if (cellA4Value) {
        if (cellA4Value.includes('american express') || cellA4Value.includes('אמריקן אקספרס')) {
            return ImportFileType.AMERICAN_EXPRESS_CREDIT;
        }

        if (cellA4Value.includes('mastercard') || cellA4Value.includes('מסטרקארד')) {
            return ImportFileType.MASTERCARD_CREDIT;
        }

        if (cellA4Value.includes('cal') || cellA4Value.includes('כאל')) {
          return ImportFileType.VISA_CREDIT;
      }
    }

    if (cellA1Value) {
        if (cellA1Value.includes('american express') || cellA1Value.includes('אמריקן אקספרס')) {
            return ImportFileType.AMERICAN_EXPRESS_CREDIT;
        }

        if (cellA1Value.includes('mastercard') || cellA1Value.includes('מאסטרקארד')) {
            return ImportFileType.MASTERCARD_CREDIT;
        }

        if (cellA1Value.includes('visa') || cellA1Value.includes('ויזה')) {
            return ImportFileType.VISA_CREDIT;
        }
    }

    logger.error(`Could not infer import file type for ${originalFileName}. Cell A1 or A4 content did not match known patterns.`);
    throw new Error(`Unable to determine import file type for ${originalFileName}. Please ensure the file format is supported.`);
  }
}

export const importService = new ImportService();
