"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class TransactionFileRepository {
    constructor() {
        this.prisma = client_1.default;
    }
    async createTransactionFile(transactionId, fileData) {
        const result = await this.prisma.transactionFile.create({
            data: Object.assign({ transactionId }, fileData),
        });
        return result.id;
    }
    async getTransactionFiles(transactionId) {
        const files = await this.prisma.transactionFile.findMany({
            where: { transactionId },
            orderBy: { createdAt: 'desc' },
        });
        return files;
    }
    async getTransactionFileById(fileId) {
        return await this.prisma.transactionFile.findUnique({
            where: { id: fileId },
        });
    }
    async updateTransactionFile(fileId, updateData) {
        await this.prisma.transactionFile.update({
            where: { id: fileId },
            data: updateData,
        });
    }
    async deleteTransactionFile(fileId) {
        await this.prisma.transactionFile.delete({
            where: { id: fileId },
        });
    }
    async deleteTransactionFiles(transactionId) {
        await this.prisma.transactionFile.deleteMany({
            where: { transactionId },
        });
    }
}
exports.default = new TransactionFileRepository();
