"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importedTransactionRepository = exports.ImportedTransactionRepository = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class ImportedTransactionRepository {
    async createMany(transactions) {
        const result = await client_1.default.importedTransaction.createMany({
            data: transactions,
        });
        return result.count;
    }
    async findByUserIdAndImportId(userId, importId) {
        return client_1.default.importedTransaction.findMany({
            where: {
                userId,
                importId,
                deleted: false,
            },
            include: {
                matchingTransaction: true,
            },
            orderBy: { date: 'desc' },
        });
    }
    async findByImportId(importId) {
        return client_1.default.importedTransaction.findMany({
            where: {
                importId,
                deleted: false,
            },
            orderBy: { date: 'desc' },
        });
    }
    async findById(id) {
        return client_1.default.importedTransaction.findUnique({
            where: { id },
            include: {
                matchingTransaction: true,
            },
        });
    }
    async delete(id) {
        await client_1.default.importedTransaction.delete({
            where: { id },
        });
    }
    async updateStatus(id, userId, status) {
        await client_1.default.importedTransaction.update({
            where: { id, userId },
            data: { status },
        });
    }
    async softDelete(id, userId) {
        await client_1.default.importedTransaction.update({
            where: { id, userId },
            data: { deleted: true },
        });
    }
}
exports.ImportedTransactionRepository = ImportedTransactionRepository;
exports.importedTransactionRepository = new ImportedTransactionRepository();
