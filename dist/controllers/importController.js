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
exports.importController = exports.MergeImportedTransactionRequest = exports.IgnoreImportedTransactionRequest = exports.ApproveImportedTransactionRequest = exports.GetImportedTransactionsRequest = exports.ProcessImportRequest = void 0;
const class_validator_1 = require("class-validator");
const importService_1 = require("../services/importService");
const logger_1 = __importDefault(require("../utils/logger"));
const class_transformer_1 = require("class-transformer");
class ProcessImportRequest {
}
exports.ProcessImportRequest = ProcessImportRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessImportRequest.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessImportRequest.prototype, "originalFileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessImportRequest.prototype, "paymentMonth", void 0);
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
], ApproveImportedTransactionRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ApproveImportedTransactionRequest.prototype, "value", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], ApproveImportedTransactionRequest.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveImportedTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ApproveImportedTransactionRequest.prototype, "categoryId", void 0);
class IgnoreImportedTransactionRequest {
}
exports.IgnoreImportedTransactionRequest = IgnoreImportedTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IgnoreImportedTransactionRequest.prototype, "transactionId", void 0);
class MergeImportedTransactionRequest {
}
exports.MergeImportedTransactionRequest = MergeImportedTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeImportedTransactionRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MergeImportedTransactionRequest.prototype, "value", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], MergeImportedTransactionRequest.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeImportedTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeImportedTransactionRequest.prototype, "categoryId", void 0);
class ImportController {
    async processImport(req, userId) {
        const { fileUrl, originalFileName, paymentMonth } = req;
        try {
            logger_1.default.debug('Start process import', {
                fileUrl,
                originalFileName,
                paymentMonth,
                userId,
            });
            const result = await importService_1.importService.processImport(fileUrl, userId, originalFileName, paymentMonth);
            logger_1.default.debug('Done process import', { result });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to process import`, {
                fileUrl,
                originalFileName,
                paymentMonth,
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
    async approveImportedTransaction(importedTransactionId, userId, data) {
        var _a;
        try {
            logger_1.default.debug('Start approve imported transaction', {
                importedTransactionId,
                userId,
                data,
            });
            await importService_1.importService.approveImportedTransaction(importedTransactionId, userId, {
                description: data.description,
                value: data.value,
                date: data.date,
                type: data.type,
                categoryId: (_a = data.categoryId) !== null && _a !== void 0 ? _a : null,
            });
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
    async mergeImportedTransaction(importedTransactionId, userId, data) {
        try {
            logger_1.default.debug('Start merge imported transaction', {
                importedTransactionId,
                userId,
                data,
            });
            await importService_1.importService.mergeImportedTransaction(importedTransactionId, userId, data);
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
    async ignoreImportedTransaction(importedTransactionId, userId) {
        try {
            logger_1.default.debug('Start ignore imported transaction', {
                importedTransactionId,
                userId,
            });
            await importService_1.importService.ignoreImportedTransaction(importedTransactionId, userId);
            logger_1.default.debug('Done ignore imported transaction');
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Failed to ignore imported transaction`, {
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
