import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { importService } from '../services/importService';
import { autoApproveRuleRepository } from '../repositories/autoApproveRuleRepository';
import logger from '../utils/logger';
import { TransactionType } from '../types/transaction';
import { Type } from 'class-transformer';

export class ProcessImportRequest {
  @IsString()
  fileUrl: string;

  @IsString()
  originalFileName: string;

  @IsString()
  @IsOptional()
  paymentMonth?: string;
}

export class GetImportedTransactionsRequest {
  @IsString()
  importId: string;
}

export class ApproveImportedTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  value: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  type: TransactionType;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class IgnoreImportedTransactionRequest {
  @IsString()
  transactionId: string;
}

export class MergeImportedTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  value: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  type: TransactionType;

  @IsString()
  categoryId: string;
}

export class BatchActionRequest {
  @IsString()
  importId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  transactionIds?: string[];

  @IsString()
  action: 'approve' | 'ignore';
}

export class CreateAutoApproveRuleRequest {
  @IsString()
  descriptionPattern: string;

  @IsString()
  categoryId: string;

  @IsString()
  type: TransactionType;
}

export class UpdateAutoApproveRuleRequest {
  @IsString()
  @IsOptional()
  descriptionPattern?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  type?: TransactionType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

class ImportController {
  async processImport(req: ProcessImportRequest, userId: string) {
    const { fileUrl, originalFileName, paymentMonth } = req;
    try {
      logger.debug('Start process import', {
        fileUrl,
        originalFileName,
        paymentMonth,
        userId,
      });
      const result = await importService.processImport(
        fileUrl,
        userId,
        originalFileName,
        paymentMonth,
      );
      logger.debug('Done process import', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to process import`, {
        fileUrl,
        originalFileName,
        paymentMonth,
        userId,
        error,
      });
      throw error;
    }
  }

  async getImports(userId: string) {
    try {
      logger.debug('Start get imports', { userId });
      const result = await importService.getImports(userId);
      logger.debug('Done get imports', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to get imports`, { userId, error });
      throw error;
    }
  }

  async getImportedTransactions(
    req: GetImportedTransactionsRequest,
    userId: string,
  ) {
    try {
      logger.debug('Start get imported transactions', {
        req,
        userId,
      });
      const result = await importService.getImportedTransactions(
        req.importId,
        userId,
      );
      logger.debug('Done get imported transactions', { result });
      return result;
    } catch (error) {
      logger.error(`Failed to get imported transactions`, {
        req,
        userId,
        error,
      });
      throw error;
    }
  }

  async approveImportedTransaction(
    importedTransactionId: string,
    userId: string,
    data: ApproveImportedTransactionRequest,
  ) {
    try {
      logger.debug('Start approve imported transaction', {
        importedTransactionId,
        userId,
        data,
      });

      await importService.approveImportedTransaction(
        importedTransactionId,
        userId,
        {
          description: data.description,
          value: data.value,
          date: data.date,
          type: data.type,
          categoryId: data.categoryId ?? null,
        },
      );
      logger.debug('Done approve imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to approve imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async mergeImportedTransaction(
    importedTransactionId: string,
    userId: string,
    data: MergeImportedTransactionRequest,
  ) {
    try {
      logger.debug('Start merge imported transaction', {
        importedTransactionId,
        userId,
        data,
      });
      await importService.mergeImportedTransaction(
        importedTransactionId,
        userId,
        data,
      );
      logger.debug('Done merge imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to merge imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async ignoreImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    try {
      logger.debug('Start ignore imported transaction', {
        importedTransactionId,
        userId,
      });

      await importService.ignoreImportedTransaction(
        importedTransactionId,
        userId,
      );
      logger.debug('Done ignore imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to ignore imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }

  async deleteImport(importId: string, userId: string) {
    try {
      logger.debug('Start delete import', { importId, userId });
      await importService.deleteImport(importId, userId);
      logger.debug('Done delete import');
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete import', { importId, userId, error });
      throw error;
    }
  }

  async deleteImportedTransaction(
    importedTransactionId: string,
    userId: string,
  ) {
    try {
      logger.debug('Start delete imported transaction', {
        importedTransactionId,
        userId,
      });

      await importService.deleteImportedTransaction(
        importedTransactionId,
        userId,
      );
      logger.debug('Done delete imported transaction');
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete imported transaction`, {
        importedTransactionId,
        userId,
        error,
      });
      throw error;
    }
  }
  async batchAction(req: BatchActionRequest, userId: string) {
    try {
      logger.debug('Start batch action', { req, userId });
      const transactionIds = req.transactionIds || 'all';

      let result;
      if (req.action === 'approve') {
        result = await importService.batchApproveImportedTransactions(
          req.importId,
          transactionIds,
          userId,
        );
      } else {
        result = await importService.batchIgnoreImportedTransactions(
          req.importId,
          transactionIds,
          userId,
        );
      }

      logger.debug('Done batch action', { result });
      return result;
    } catch (error) {
      logger.error('Failed batch action', { req, userId, error });
      throw error;
    }
  }

  async applyAutoApproveRules(importId: string, userId: string) {
    try {
      logger.debug('Start apply auto-approve rules', { importId, userId });
      const result = await importService.applyAutoApproveRules(
        importId,
        userId,
      );
      logger.debug('Done apply auto-approve rules', { result });
      return result;
    } catch (error) {
      logger.error('Failed to apply auto-approve rules', {
        importId,
        userId,
        error,
      });
      throw error;
    }
  }

  async getAutoApproveRules(userId: string) {
    try {
      return await autoApproveRuleRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Failed to get auto-approve rules', { userId, error });
      throw error;
    }
  }

  async createAutoApproveRule(
    req: CreateAutoApproveRuleRequest,
    userId: string,
  ) {
    try {
      return await autoApproveRuleRepository.create({
        userId,
        descriptionPattern: req.descriptionPattern,
        categoryId: req.categoryId,
        type: req.type as any,
      });
    } catch (error) {
      logger.error('Failed to create auto-approve rule', {
        req,
        userId,
        error,
      });
      throw error;
    }
  }

  async updateAutoApproveRule(
    ruleId: string,
    req: UpdateAutoApproveRuleRequest,
    userId: string,
  ) {
    try {
      return await autoApproveRuleRepository.update(ruleId, userId, req as any);
    } catch (error) {
      logger.error('Failed to update auto-approve rule', {
        ruleId,
        req,
        userId,
        error,
      });
      throw error;
    }
  }

  async deleteAutoApproveRule(ruleId: string, userId: string) {
    try {
      await autoApproveRuleRepository.delete(ruleId, userId);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete auto-approve rule', {
        ruleId,
        userId,
        error,
      });
      throw error;
    }
  }
}

export const importController = new ImportController();
