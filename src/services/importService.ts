import {
  Import,
  ImportStatus,
  TransactionType,
  TransactionStatus,
  ImportedTransactionStatus,
} from '@prisma/client';
import logger from '../utils/logger';
import { importRepository } from '../repositories/importRepository';
import { importedTransactionRepository } from '../repositories/importedTransactionRepository';
import transactionRepository from '../repositories/transactionRepository';
import transactionService from './transactionService';
import { excelExtractionAgentClient } from '../clients/excelExtractionAgentClient';
import prisma from '../prisma/client';
import AIServiceFactory from './ai/aiServiceFactory';

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
  ): Promise<Import> {
    try {
      logger.info('Starting import with excel extraction agent', {
        userId,
        originalFileName,
        fileUrl: fileUrl.substring(0, 100),
      });

      const importRecord = await importRepository.create({
        fileUrl,
        originalFileName,
        userId,
        importType: null,
        bankSourceType: null,
        creditCardLastFourDigits: null,
        paymentMonth: paymentMonthFromRequest || null,
        excelExtractionRequestId: null,
      });

      logger.info('Created import record', {
        importId: importRecord.id,
        userId,
      });

      try {
        const extractionResponse =
          await excelExtractionAgentClient.submitExtractionRequest({
            fileUrl,
            filename: originalFileName,
            userId,
            options: {
              confidenceThreshold: 0.7,
              maxRetries: 3,
              includeRawData: false,
            },
          });

        logger.info('Extraction request submitted', {
          importId: importRecord.id,
          extractionRequestId: extractionResponse.requestId,
        });

        await importRepository.updateStatus(
          importRecord.id,
          ImportStatus.PROCESSING,
        );

        await this.updateImportWithExtractionRequestId(
          importRecord.id,
          extractionResponse.requestId,
        );

        return importRecord;
      } catch (error) {
        logger.error('Failed to submit extraction request', {
          importId: importRecord.id,
          error,
        });

        await importRepository.updateStatus(
          importRecord.id,
          ImportStatus.FAILED,
          error instanceof Error
            ? error.message
            : 'Failed to submit extraction request',
        );

        throw error;
      }
    } catch (error) {
      logger.error('Error processing import:', error);
      throw error;
    }
  }

  private async updateImportWithExtractionRequestId(
    importId: string,
    extractionRequestId: string,
  ): Promise<void> {
    await prisma.import.update({
      where: { id: importId },
      data: { excelExtractionRequestId: extractionRequestId },
    });
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

  public async findPotentialMatchesForImport(
    importId: string,
    userId: string,
  ): Promise<void> {
    try {
      logger.info('Finding potential matches for import', {
        importId,
        userId,
      });

      const importedTransactions =
        await importedTransactionRepository.findByImportId(importId);

      logger.info('Processing imported transactions for matches', {
        importId,
        count: importedTransactions.length,
      });

      await Promise.all(
        importedTransactions.map(async (transaction) => {
          try {
            const matches = await transactionRepository.findPotentialMatches(
              userId,
              transaction.date,
              transaction.value,
            );

            let matchingTransactionId = null;
            if (matches.length > 0) {
              logger.debug('Found potential matches for transaction', {
                transactionId: transaction.id,
                matchCount: matches.length,
              });

              const bestMatchId = await this.aiProvider.findMatchingTransaction(
                transaction.description,
                matches,
              );

              matchingTransactionId = bestMatchId ?? matches[0]?.id ?? null;

              logger.debug('Selected matching transaction', {
                transactionId: transaction.id,
                matchingTransactionId,
                usedAI: !!bestMatchId,
              });
            }

            if (matchingTransactionId) {
              await prisma.importedTransaction.update({
                where: { id: transaction.id },
                data: { matchingTransactionId },
              });
            }
          } catch (error) {
            logger.error('Error finding match for transaction', {
              transactionId: transaction.id,
              error,
            });
            // Continue processing other transactions even if one fails
          }
        }),
      );

      logger.info('Completed finding potential matches', {
        importId,
      });
    } catch (error) {
      logger.error('Error finding potential matches for import', {
        importId,
        error,
      });
      throw error;
    }
  }
}

export const importService = new ImportService();
