import { Request, Response } from 'express';
import logger from '../utils/logger';
import { verifyWebhookToken, extractWebhookParams } from '../utils/webhookAuth';
import { ExcelExtractionWebhookPayload } from '../clients/excelExtractionAgentClientTypes';
import { importRepository } from '../repositories/importRepository';
import { importedTransactionRepository } from '../repositories/importedTransactionRepository';
import {
  ImportStatus,
  TransactionType,
  ImportBankSourceType,
} from '@prisma/client';
import prisma from '../prisma/client';
import { importService } from '../services/importService';

class ExcelExtractionWebhookController {
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const webhookPayload: ExcelExtractionWebhookPayload = req.body;

    try {
      logger.info('Received excel extraction webhook', {
        requestId: webhookPayload.requestId,
        status: webhookPayload.status,
      });

      const authParams = extractWebhookParams(req.query);
      if (!authParams) {
        logger.error('Missing authentication parameters in webhook', {
          requestId: webhookPayload.requestId,
        });
        res.status(401).json({
          success: false,
          error: 'Missing authentication parameters',
        });
        return;
      }

      const isValid = verifyWebhookToken(
        authParams.token,
        authParams.userId,
        authParams.timestamp,
      );

      if (!isValid) {
        logger.error('Invalid webhook authentication', {
          requestId: webhookPayload.requestId,
          userId: authParams.userId,
        });
        res.status(401).json({
          success: false,
          error: 'Invalid authentication',
        });
        return;
      }

      const importRecord = await importRepository.findByExtractionRequestId(
        webhookPayload.requestId,
      );

      if (!importRecord) {
        logger.error('Import record not found for extraction request', {
          requestId: webhookPayload.requestId,
        });
        res.status(404).json({
          success: false,
          error: 'Import record not found',
        });
        return;
      }

      if (importRecord.userId !== authParams.userId) {
        logger.error('User ID mismatch in webhook', {
          requestId: webhookPayload.requestId,
          expectedUserId: importRecord.userId,
          receivedUserId: authParams.userId,
        });
        res.status(403).json({
          success: false,
          error: 'Unauthorized access',
        });
        return;
      }

      switch (webhookPayload.status) {
        case 'COMPLETED':
          await this.handleCompletedExtraction(importRecord.id, webhookPayload);
          break;
        case 'FAILED':
          await this.handleFailedExtraction(importRecord.id, webhookPayload);
          break;
        default:
          throw new Error(`Invalid webhook status: ${webhookPayload.status}`);
      }

      logger.info('Webhook processed successfully', {
        requestId: webhookPayload.requestId,
        importId: importRecord.id,
        status: webhookPayload.status,
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      logger.error('Error processing webhook', {
        error,
        requestId: webhookPayload.requestId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
      });
    }
  }

  private async handleCompletedExtraction(
    importId: string,
    payload: ExcelExtractionWebhookPayload,
  ): Promise<void> {
    if (!payload.result) {
      throw new Error('Missing extraction result in completed webhook');
    }

    const { result } = payload;

    logger.info('Processing completed extraction', {
      importId,
      transactionCount: result.transactions.length,
      creditCardLastFour: result.metadata.creditCardLastFour,
      paymentMonth: result.metadata.paymentMonth,
    });

    const transactions = result.transactions.map((transaction) => {
      const [day, month, year] = transaction.date.split('/').map(Number);
      const date = new Date(year, month - 1, day);

      return {
        description: transaction.description,
        value: transaction.value,
        date,
        type: transaction.type as TransactionType,
        rawData: transaction.rawData || {},
        matchingTransactionId: null,
        importId,
      };
    });

    // Get userId from import record
    const importRecord = await importRepository.findById(importId);
    if (!importRecord) {
      throw new Error(`Import record not found: ${importId}`);
    }

    await prisma.import.update({
      where: { id: importId },
      data: {
        creditCardLastFourDigits: result.metadata.creditCardLastFour,
        paymentMonth: result.metadata.paymentMonth,
        bankSourceType: result.metadata
          .bankSourceType as ImportBankSourceType | null,
      },
    });

    // Check for duplicate import after we have the metadata
    const existingImport = await importRepository.findExisting(
      importRecord.userId,
      result.metadata.paymentMonth,
      result.metadata.creditCardLastFour,
    );

    let finalImportId = importId;
    let shouldDeleteCurrentImport = false;

    if (existingImport && existingImport.id !== importId) {
      logger.info('Found duplicate import, merging transactions', {
        currentImportId: importId,
        existingImportId: existingImport.id,
        paymentMonth: result.metadata.paymentMonth,
        creditCardLastFour: result.metadata.creditCardLastFour,
      });

      // Filter out duplicate transactions before merging
      const nonDuplicateTransactions =
        await importedTransactionRepository.filterDuplicates(
          existingImport.id,
          transactions.map((transaction) => ({
            ...transaction,
            userId: importRecord.userId,
          })),
        );

      if (nonDuplicateTransactions.length > 0) {
        // Create non-duplicate transactions with the existing import ID
        await importedTransactionRepository.createMany(
          nonDuplicateTransactions.map((transaction) => ({
            ...transaction,
            importId: existingImport.id,
          })),
        );

        logger.info('Merged non-duplicate transactions to existing import', {
          existingImportId: existingImport.id,
          mergedTransactionCount: nonDuplicateTransactions.length,
          totalTransactionCount: transactions.length,
        });
      }

      // Use the existing import for potential matching
      finalImportId = existingImport.id;
      shouldDeleteCurrentImport = true;
    }

    if (transactions.length > 0 && !shouldDeleteCurrentImport) {
      await importedTransactionRepository.createMany(
        transactions.map((transaction) => ({
          ...transaction,
          userId: importRecord.userId,
        })),
      );
    }

    // Find potential matches for imported transactions
    try {
      await importService.findPotentialMatchesForImport(
        finalImportId,
        importRecord.userId,
      );
    } catch (error) {
      logger.error('Error finding potential matches for import', {
        importId: finalImportId,
        error,
      });
      // Continue processing even if matching fails
    }

    if (shouldDeleteCurrentImport) {
      // Delete the duplicate import record
      await prisma.import.delete({
        where: { id: importId },
      });

      logger.info('Deleted duplicate import record', {
        deletedImportId: importId,
        keptImportId: finalImportId,
      });
    } else {
      await importRepository.updateStatus(importId, ImportStatus.COMPLETED);
    }

    logger.info('Completed extraction processed successfully', {
      importId,
      transactionCount: transactions.length,
    });
  }

  private async handleFailedExtraction(
    importId: string,
    payload: ExcelExtractionWebhookPayload,
  ): Promise<void> {
    const errorMessage = payload.error || 'Unknown extraction error';

    logger.error('Processing failed extraction', {
      importId,
      error: errorMessage,
    });

    await importRepository.updateStatus(
      importId,
      ImportStatus.FAILED,
      errorMessage,
    );

    logger.info('Failed extraction processed', {
      importId,
      error: errorMessage,
    });
  }
}

export const excelExtractionWebhookController =
  new ExcelExtractionWebhookController();
