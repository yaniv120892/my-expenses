import {
  Import,
  ImportStatus,
  ImportFileType,
  TransactionType,
  TransactionStatus,
  ImportedTransactionStatus,
  ImportBankSourceType,
  ImportedTransaction,
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
  [ImportBankSourceType.BANK_CREDIT]: 5,
  [ImportBankSourceType.NON_BANK_CREDIT]: 6,
};

const skipLastRows = {
  [ImportBankSourceType.BANK_CREDIT]: 3,
  [ImportBankSourceType.NON_BANK_CREDIT]: 1,
};

const headerRow = {
  [ImportBankSourceType.BANK_CREDIT]:
    startProcessingRow[ImportBankSourceType.BANK_CREDIT] - 1,
  [ImportBankSourceType.NON_BANK_CREDIT]:
    startProcessingRow[ImportBankSourceType.NON_BANK_CREDIT] - 1,
};

const ParsedTransactionFieldToColumnMap = {
  [ImportBankSourceType.BANK_CREDIT]: {
    date: 0,
    description: 1,
    value: 2,
  },
  [ImportBankSourceType.NON_BANK_CREDIT]: {
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
    const s3Key = this.getS3KeyFromUrl(fileUrl);
    try {
      const workbook = await this.downloadAndParseFile(s3Key);
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];

      const inferredImportType = await this.inferImportFileType(
        firstSheet,
        originalFileName,
      );
      const inferredBankSourceType = this.inferBankSourceType(firstSheet);
      const creditCardLastFour = this.extractCreditCardLastFour(
        firstSheet,
        originalFileName,
      );
      const paymentMonth = this.extractPaymentMonth(
        firstSheet,
        originalFileName,
        paymentMonthFromRequest,
      );

      logger.debug('Inferred import details', {
        inferredImportType,
        inferredBankSourceType,
        creditCardLastFour,
        paymentMonth,
      });

      const importRecord = await this.findOrCreateImport(
        userId,
        paymentMonth,
        creditCardLastFour,
        inferredBankSourceType,
        fileUrl,
        originalFileName,
        inferredImportType,
      );

      try {
        const newTransactions = await this.processWorkbook(
          workbook,
          inferredBankSourceType,
          firstSheet,
        );
        const existingTransactions =
          await importedTransactionRepository.findByImportId(importRecord.id);
        const transactionsToSave = this.filterNewTransactions(
          newTransactions,
          existingTransactions,
        );

        if (transactionsToSave.length > 0) {
          const transactionsWithMatches = await this.findPotentialMatches(
            transactionsToSave,
            userId,
          );

          await importedTransactionRepository.createMany(
            transactionsWithMatches.map((transaction) => ({
              ...transaction,
              importId: importRecord.id,
              userId,
            })),
          );
        }

        await importRepository.updateStatus(
          importRecord.id,
          ImportStatus.COMPLETED,
        );

        await this.deleteFileFromS3(s3Key);

        return importRecord;
      } catch (error) {
        await importRepository.updateStatus(
          importRecord.id,
          ImportStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error occurred',
        );
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

  private async findOrCreateImport(
    userId: string,
    paymentMonth: string,
    creditCardLastFourDigits: string,
    bankSourceType: ImportBankSourceType,
    fileUrl: string,
    originalFileName: string,
    importType: ImportFileType,
  ): Promise<Import> {
    let importRecord = await importRepository.findExisting(
      userId,
      paymentMonth,
      creditCardLastFourDigits,
      bankSourceType,
    );

    if (!importRecord) {
      importRecord = await importRepository.create({
        fileUrl,
        originalFileName,
        importType,
        bankSourceType,
        userId,
        creditCardLastFourDigits,
        paymentMonth,
      });
    }

    return importRecord;
  }

  private filterNewTransactions(
    newTransactions: ParsedTransaction[],
    existingTransactions: ImportedTransaction[],
  ): ParsedTransaction[] {
    const existingTransactionKeys = new Set(
      existingTransactions.map(
        (t) => `${t.description}_${t.value}_${t.date.toISOString()}`,
      ),
    );

    return newTransactions.filter((t) => {
      const key = `${t.description}_${t.value}_${t.date.toISOString()}`;
      return !existingTransactionKeys.has(key);
    });
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
    bankSourceType: ImportBankSourceType,
    firstSheet: XLSX.WorkSheet,
  ): Promise<ParsedTransaction[]> {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
    }) as string[][];
    return this.processRows(rows, bankSourceType, firstSheet);
  }

  private detectNewAmexFormatStructure(rows: string[][]): {
    startRow: number;
    headerRow: number;
    columnMap: { date: number; description: number; value: number };
  } | null {
    if (
      rows.length > 11 &&
      rows[11] &&
      rows[11][0] &&
      (String(rows[11][0]).includes('תאריך רכישה') ||
        String(rows[11][0]).includes('עסקאות למועד חיוב'))
    ) {
      return {
        startRow: 12,
        headerRow: 11,
        columnMap: { date: 0, description: 1, value: 2 },
      };
    }

    return null;
  }

  private processNewAmexFormatRows(
    rows: string[][],
    bankSourceType: ImportBankSourceType,
    structure: {
      startRow: number;
      headerRow: number;
      columnMap: { date: number; description: number; value: number };
    },
  ): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const { startRow, headerRow, columnMap } = structure;
    const headers = this.extractHeaders(rows, headerRow);
    const lastRowsToSkip = 4;

    for (let i = startRow; i < rows.length - lastRowsToSkip; i++) {
      try {
        const currentRow = rows[i];
        this.validateRow(currentRow, bankSourceType, columnMap);

        const date = this.validateAndParseDate(
          currentRow[columnMap.date],
          bankSourceType,
        );
        const description = this.validateAndParseDescription(
          currentRow[columnMap.description],
          bankSourceType,
        );
        const value = this.validateAndParseAmount(
          currentRow[columnMap.value],
          bankSourceType,
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
        logger.error(`Error processing new Amex format row:`, {
          error,
          row: rows[i],
          rowIndex: i + 1,
        });
        throw error;
      }
    }

    return transactions;
  }

  private processOldFormatRows(
    rows: string[][],
    bankSourceType: ImportBankSourceType,
  ): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const startRow = startProcessingRow[bankSourceType];
    const columnMap = ParsedTransactionFieldToColumnMap[bankSourceType];
    const lastRowsToSkip = skipLastRows[bankSourceType];
    const headers = this.extractHeaders(rows, headerRow[bankSourceType]);

    for (let i = startRow; i < rows.length - lastRowsToSkip; i++) {
      try {
        const currentRow = rows[i];
        this.validateRow(currentRow, bankSourceType);

        const date = this.validateAndParseDate(
          currentRow[columnMap.date],
          bankSourceType,
        );
        const description = this.validateAndParseDescription(
          currentRow[columnMap.description],
          bankSourceType,
        );
        const value = this.validateAndParseAmount(
          currentRow[columnMap.value],
          bankSourceType,
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
        logger.error(`Error processing ${bankSourceType} row:`, {
          error,
          row: rows[i],
          rowIndex: i + 1,
        });
        throw error;
      }
    }

    return transactions;
  }

  private processRows(
    rows: string[][],
    bankSourceType: ImportBankSourceType,
    firstSheet?: XLSX.WorkSheet,
  ): ParsedTransaction[] {
    // Check if this is an old credit card format file (CAL, Visa, Mastercard - should use old format processing)
    if (firstSheet && this.isOldCreditCardFormat(firstSheet)) {
      return this.processOldFormatRows(rows, bankSourceType);
    }

    const newAmexStructure = this.detectNewAmexFormatStructure(rows);
    if (newAmexStructure) {
      return this.processNewAmexFormatRows(
        rows,
        bankSourceType,
        newAmexStructure,
      );
    }

    return this.processOldFormatRows(rows, bankSourceType);
  }

  private validateRow(
    row: string[],
    bankSourceType: ImportBankSourceType,
    columnMap?: { date: number; description: number; value: number },
  ) {
    if (!row) {
      throw new Error(`Invalid row: ${row}, bankSourceType: ${bankSourceType}`);
    }

    const map = columnMap || ParsedTransactionFieldToColumnMap[bankSourceType];

    if (!row[map.date]) {
      throw new Error(
        `Invalid row: ${row}, bankSourceType: ${bankSourceType}, missing date column`,
      );
    }

    if (!row[map.description]) {
      throw new Error(
        `Invalid row: ${row}, bankSourceType: ${bankSourceType}, missing description column`,
      );
    }

    if (!row[map.value]) {
      throw new Error(
        `Invalid row: ${row}, bankSourceType: ${bankSourceType}, missing value column`,
      );
    }
  }

  private validateAndParseDate(
    dateValue: string,
    bankSourceType: ImportBankSourceType,
  ): Date {
    if (!dateValue) {
      throw new Error(
        `Invalid date value: ${dateValue}, bankSourceType: ${bankSourceType}`,
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
          `Invalid date format: ${dateValue}, bankSourceType: ${bankSourceType}`,
        );
      }
      return date;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to parse date: ${dateValue}, bankSourceType: ${bankSourceType}, error: ${errorMessage}`,
      );
    }
  }

  private validateAndParseDescription(
    description: string,
    bankSourceType: ImportBankSourceType,
  ): string {
    if (
      !description ||
      typeof description !== 'string' ||
      description.trim() === ''
    ) {
      throw new Error(
        `Invalid description: ${description}, bankSourceType: ${bankSourceType}`,
      );
    }
    return description.trim();
  }

  private validateAndParseAmount(
    amount: string,
    bankSourceType: ImportBankSourceType,
  ): number {
    if (!amount) {
      throw new Error(
        `Invalid amount: ${amount}, bankSourceType: ${bankSourceType}`,
      );
    }

    try {
      const cleanAmount = String(amount).replace(/[^\d.-]/g, '');
      const parsedAmount = parseFloat(cleanAmount);

      if (isNaN(parsedAmount)) {
        throw new Error(
          `Invalid amount format: ${amount}, bankSourceType: ${bankSourceType}`,
        );
      }

      return Math.abs(parsedAmount);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to parse amount: ${amount}, bankSourceType: ${bankSourceType}, error: ${errorMessage}`,
      );
    }
  }

  private parseDate(dateStr: string): Date {
    try {
      let day: number, month: number, year: number;

      // Check if the date uses dots (DD.MM.YY format)
      if (dateStr.includes('.')) {
        const [dayStr, monthStr, yearStr] = String(dateStr).split('.');
        day = Number(dayStr);
        month = Number(monthStr);
        year = Number(yearStr);

        // Handle 2-digit years (YY format)
        if (year < 100) {
          // Assume years 00-29 are 2000-2029, years 30-99 are 1930-1999
          year = year < 30 ? 2000 + year : 1900 + year;
        }
      } else {
        // Original format with forward slashes (DD/MM/YYYY)
        [day, month, year] = String(dateStr).split('/').map(Number);
      }

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
  private creditCardLastFourFileNamePattern =
    /^(\d{4})_(\d{2})_(\d{4})(\.\w+)?$/;

  private extractCreditCardFromRows(firstSheet: XLSX.WorkSheet): string | null {
    const possibleCreditCardRows = [
      XLSX.utils.encode_cell({ r: 0, c: 0 }),
      XLSX.utils.encode_cell({ r: 1, c: 0 }),
      XLSX.utils.encode_cell({ r: 3, c: 0 }),
      XLSX.utils.encode_cell({ r: 4, c: 0 }),
    ];
    for (const rowRef of possibleCreditCardRows) {
      const cell = firstSheet[rowRef];
      const cellValue = cell && cell.v ? String(cell.v) : null;
      if (cellValue) {
        for (const pattern of this.creditCardPatterns) {
          const match = cellValue.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    }

    return null;
  }

  private extractCreditCardLastFour(
    firstSheet: XLSX.WorkSheet,
    originalFileName: string,
  ): string {
    try {
      const creditCardLastFour =
        this.extractCreditCardLastFourFromFileName(originalFileName) ??
        this.extractCreditCardFromRows(firstSheet);
      if (creditCardLastFour) {
        return creditCardLastFour;
      }

      throw new Error('Credit card last four digits not found');
    } catch (error) {
      logger.error('Failed to extract credit card last four digits', { error });
      throw error;
    }
  }

  private extractCreditCardLastFourFromFileName(
    originalFileName: string,
  ): string | null {
    try {
      const fileNameMatch = originalFileName.match(
        this.creditCardLastFourFileNamePattern,
      );
      if (fileNameMatch && fileNameMatch[1]) {
        return fileNameMatch[1];
      }
      return null;
    } catch (error) {
      logger.error('Failed to determine credit card last four digits', {
        error,
      });
      throw error;
    }
  }

  private extractPaymentMonth(
    firstSheet: XLSX.WorkSheet,
    originalFileName: string,
    paymentMonthFromRequest?: string,
  ): string {
    try {
      if (paymentMonthFromRequest) {
        return paymentMonthFromRequest;
      }

      const paymentMonthFromFileName =
        this.extractPaymentMonthFromFileName(originalFileName);
      if (paymentMonthFromFileName) {
        return paymentMonthFromFileName;
      }

      const paymentMonthFromRows = this.extractPaymentMonthFromRows(firstSheet);
      if (paymentMonthFromRows) {
        return paymentMonthFromRows;
      }

      throw new Error('Payment month not found');
    } catch (error) {
      logger.error('Failed to determine payment month', { error });
      throw error;
    }
  }

  private extractPaymentMonthFromRows(firstSheet: XLSX.WorkSheet): string {
    try {
      // First check cell C2 for Hebrew month format
      const cellC2Ref = XLSX.utils.encode_cell({ r: 1, c: 2 });
      const cellC2 = firstSheet[cellC2Ref];
      const cellC2Value = cellC2 && cellC2.v ? String(cellC2.v) : null;
      if (cellC2Value) {
        const hebrewMonthMatch = this.parseHebrewMonthAndYear(cellC2Value);
        if (hebrewMonthMatch) {
          return hebrewMonthMatch;
        }
      }

      const cellA2Ref = XLSX.utils.encode_cell({ r: 2, c: 0 });
      const cellA2 = firstSheet[cellA2Ref];
      const cellA2Value = cellA2 && cellA2.v ? String(cellA2.v) : null;
      if (cellA2Value) {
        const hebrewTextMatch = this.parseHebrewTextFormat(cellA2Value);
        if (hebrewTextMatch) {
          return hebrewTextMatch;
        }
      }

      throw new Error('Payment month not found');
    } catch (error) {
      logger.error('Failed to extract payment month', { error });
      throw error;
    }
  }

  private parseHebrewMonthAndYear(text: string): string | null {
    const hebrewMonths: { [key: string]: string } = {
      ינואר: '01',
      פברואר: '02',
      מרץ: '03',
      אפריל: '04',
      מאי: '05',
      יוני: '06',
      יולי: '07',
      אוגוסט: '08',
      ספטמבר: '09',
      אוקטובר: '10',
      נובמבר: '11',
      דצמבר: '12',
    };

    // Remove extra whitespace and normalize
    const normalizedText = text.trim().replace(/\s+/g, ' ');

    // Look for Hebrew month name followed by year
    for (const [hebrewMonth, monthNumber] of Object.entries(hebrewMonths)) {
      const pattern = new RegExp(`${hebrewMonth}\\s+(\\d{4})`, 'i');
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        return `${monthNumber}/${match[1]}`;
      }
    }

    return null;
  }

  private parseHebrewTextFormat(text: string): string | null {
    const pattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = text.match(pattern);

    if (match && match[2] && match[3]) {
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${month}/${year}`;
    }

    return null;
  }

  private extractPaymentMonthFromFileName(
    originalFileName: string,
  ): string | null {
    const fileNameMatch = originalFileName.match(
      this.paymentMonthFileNamePattern,
    );

    if (fileNameMatch && fileNameMatch[2] && fileNameMatch[3]) {
      return `${fileNameMatch[2]}/${fileNameMatch[3]}`;
    }

    return null;
  }

  private isOldCreditCardFormat(firstSheet: XLSX.WorkSheet): boolean {
    const cellA4Ref = XLSX.utils.encode_cell({ r: 3, c: 0 });
    const cellA4 = firstSheet ? firstSheet[cellA4Ref] : null;
    const cellA4Value =
      cellA4 && cellA4.v ? String(cellA4.v).toLowerCase() : null;
    return Boolean(
      cellA4Value &&
        (cellA4Value.includes('cal') ||
          cellA4Value.includes('כאל') ||
          cellA4Value.includes('ויזה') ||
          cellA4Value.includes('mastercard') ||
          cellA4Value.includes('מסטרקארד')),
    );
  }

  private isNewAmexFormat(firstSheet: XLSX.WorkSheet): boolean {
    const headerCellRef = XLSX.utils.encode_cell({ r: 11, c: 0 });
    const headerCell = firstSheet ? firstSheet[headerCellRef] : null;
    const headerCellValue =
      headerCell && headerCell.v ? String(headerCell.v).toLowerCase() : null;
    return Boolean(
      headerCellValue &&
        (headerCellValue.includes('תאריך רכישה') ||
          headerCellValue.includes('עסקאות למועד חיוב')),
    );
  }

  private isOldFormatWithHeaderInRow4(
    firstSheet: XLSX.WorkSheet,
  ): ImportFileType | null {
    const cellA4Ref = XLSX.utils.encode_cell({ r: 3, c: 0 });
    const cellA4 = firstSheet ? firstSheet[cellA4Ref] : null;
    const cellA4Value =
      cellA4 && cellA4.v ? String(cellA4.v).toLowerCase() : null;

    if (!cellA4Value) return null;

    if (
      cellA4Value.includes('american express') ||
      cellA4Value.includes('אמריקן אקספרס')
    ) {
      return ImportFileType.AMERICAN_EXPRESS_CREDIT;
    }

    if (
      cellA4Value.includes('mastercard') ||
      cellA4Value.includes('מסטרקארד')
    ) {
      return ImportFileType.MASTERCARD_CREDIT;
    }

    if (cellA4Value.includes('cal') || cellA4Value.includes('כאל')) {
      return ImportFileType.VISA_CREDIT;
    }

    return null;
  }

  private isOldFormatWithHeaderInRow1(
    firstSheet: XLSX.WorkSheet,
  ): ImportFileType | null {
    const cellA1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
    const cellA1 = firstSheet ? firstSheet[cellA1Ref] : null;
    const cellA1Value =
      cellA1 && cellA1.v ? String(cellA1.v).toLowerCase() : null;

    if (!cellA1Value) return null;

    if (
      cellA1Value.includes('american express') ||
      cellA1Value.includes('אמריקן אקספרס')
    ) {
      return ImportFileType.AMERICAN_EXPRESS_CREDIT;
    }

    if (
      cellA1Value.includes('mastercard') ||
      cellA1Value.includes('מאסטרקארד')
    ) {
      return ImportFileType.MASTERCARD_CREDIT;
    }

    if (cellA1Value.includes('visa') || cellA1Value.includes('ויזה')) {
      return ImportFileType.VISA_CREDIT;
    }

    return null;
  }

  private async inferImportFileType(
    firstSheet: XLSX.WorkSheet,
    originalFileName: string,
  ): Promise<ImportFileType> {
    if (this.isNewAmexFormat(firstSheet)) {
      return ImportFileType.AMERICAN_EXPRESS_CREDIT;
    }

    const oldFormatRow4 = this.isOldFormatWithHeaderInRow4(firstSheet);
    if (oldFormatRow4) {
      return oldFormatRow4;
    }

    const oldFormatRow1 = this.isOldFormatWithHeaderInRow1(firstSheet);
    if (oldFormatRow1) {
      return oldFormatRow1;
    }

    logger.error(
      `Could not infer import file type for ${originalFileName}. Cell A1, A4, A5, or A9 content did not match known patterns.`,
    );
    throw new Error(
      `Unable to determine import file type for ${originalFileName}. Please ensure the file format is supported.`,
    );
  }

  private inferBankSourceType(
    firstSheet: XLSX.WorkSheet,
  ): ImportBankSourceType {
    const cellA1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
    const cellA1 = firstSheet ? firstSheet[cellA1Ref] : null;
    const cellA1Value =
      cellA1 && cellA1.v ? String(cellA1.v).toLowerCase() : null;

    if (cellA1Value && cellA1Value.includes('פירוט עסקאות לחשבון')) {
      return ImportBankSourceType.BANK_CREDIT;
    }

    return ImportBankSourceType.NON_BANK_CREDIT;
  }
}

export const importService = new ImportService();
