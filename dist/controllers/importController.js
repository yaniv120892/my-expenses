"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importController = exports.RejectImportedTransactionRequest = exports.ApproveImportedTransactionRequest = exports.GetImportedTransactionsRequest = exports.ProcessImportRequest = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const importService_1 = require("../services/importService");
const logger_1 = __importDefault(require("../utils/logger"));
class ProcessImportRequest {
}
exports.ProcessImportRequest = ProcessImportRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessImportRequest.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ImportFileType),
    __metadata("design:type", String)
], ProcessImportRequest.prototype, "importType", void 0);
class GetImportedTransactionsRequest {
}
exports.GetImportedTransactionsRequest = GetImportedTransactionsRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetImportedTransactionsRequest.prototype, "importId", void 0);
class ApproveImportedTransactionRequest {
}
exports.ApproveImportedTransactionRequest = ApproveImportedTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveImportedTransactionRequest.prototype, "transactionId", void 0);
class RejectImportedTransactionRequest {
}
exports.RejectImportedTransactionRequest = RejectImportedTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectImportedTransactionRequest.prototype, "transactionId", void 0);
class ImportController {
    async processImport(req, userId) {
        const { fileUrl, importType } = req;
        try {
            logger_1.default.debug('Start process import', { fileUrl, importType, userId });
            const result = await importService_1.importService.processImport(fileUrl, importType, userId);
            logger_1.default.debug('Done process import', { result });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to process import`, {
                fileUrl,
                importType,
                userId,
                error,
            });
            throw error;
        }
    }
    async getImports(userId) {
        try {
            logger_1.default.debug('Start get imports', { userId });
            const result = await importService_1.importService.getImports(userId);
            logger_1.default.debug('Done get imports', { result });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to get imports`, { userId, error });
            throw error;
        }
    }
    async getImportedTransactions(req, userId) {
        try {
            logger_1.default.debug('Start get imported transactions', {
                req,
                userId,
            });
            const result = await importService_1.importService.getImportedTransactions(req.importId, userId);
            logger_1.default.debug('Done get imported transactions', { result });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to get imported transactions`, {
                req,
                userId,
                error,
            });
            throw error;
        }
    }
    async approveImportedTransaction(importedTransactionId, userId) {
        try {
            logger_1.default.debug('Start approve imported transaction', {
                importedTransactionId,
                userId,
            });
            await importService_1.importService.approveImportedTransaction(importedTransactionId, userId);
            logger_1.default.debug('Done approve imported transaction');
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Failed to approve imported transaction`, {
                importedTransactionId,
                userId,
                error,
            });
            throw error;
        }
    }
    async mergeImportedTransaction(importedTransactionId, userId) {
        try {
            logger_1.default.debug('Start merge imported transaction', {
                importedTransactionId,
                userId,
            });
            await importService_1.importService.mergeImportedTransaction(importedTransactionId, userId);
            logger_1.default.debug('Done merge imported transaction');
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Failed to merge imported transaction`, {
                importedTransactionId,
                userId,
                error,
            });
            throw error;
        }
    }
    async rejectImportedTransaction(importedTransactionId, userId) {
        try {
            logger_1.default.debug('Start reject imported transaction', {
                importedTransactionId,
                userId,
            });
            await importService_1.importService.rejectImportedTransaction(importedTransactionId, userId);
            logger_1.default.debug('Done reject imported transaction');
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Failed to reject imported transaction`, {
                importedTransactionId,
                userId,
                error,
            });
            throw error;
        }
    }
    async deleteImportedTransaction(importedTransactionId, userId) {
        try {
            logger_1.default.debug('Start delete imported transaction', {
                importedTransactionId,
                userId,
            });
            await importService_1.importService.deleteImportedTransaction(importedTransactionId, userId);
            logger_1.default.debug('Done delete imported transaction');
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Failed to delete imported transaction`, {
                importedTransactionId,
                userId,
                error,
            });
            throw error;
        }
    }
}
exports.importController = new ImportController();
