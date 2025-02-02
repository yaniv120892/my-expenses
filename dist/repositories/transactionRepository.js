"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("..//prisma/client"));
class TransactionRepository {
    async deleteTransaction(transactionId) {
        await client_2.default.transaction.delete({
            where: { id: transactionId },
        });
    }
    async getTransactionsSummary(filters) {
        const transactions = await client_2.default.transaction.findMany({
            where: {
                date: {
                    gte: filters.startDate,
                    lte: filters.endDate,
                },
                categoryId: filters.categoryId,
                type: filters.transactionType,
            },
        });
        const totalIncome = transactions
            .filter((transaction) => transaction.type === client_1.TransactionType.INCOME)
            .reduce((acc, transaction) => acc + transaction.value, 0);
        const totalExpense = transactions
            .filter((transaction) => transaction.type === client_1.TransactionType.EXPENSE)
            .reduce((acc, transaction) => acc + transaction.value, 0);
        return { totalIncome, totalExpense };
    }
    async createTransaction(data) {
        const transaction = await client_2.default.transaction.create({
            data: {
                description: data.description,
                value: data.value,
                date: data.date || new Date(),
                categoryId: data.categoryId,
                type: data.type,
            },
            include: { category: true },
        });
        return transaction.id;
    }
    async getTransactions(filters) {
        const transactions = await client_2.default.transaction.findMany({
            where: {
                date: {
                    gte: filters.startDate,
                    lte: filters.endDate,
                },
                categoryId: filters.categoryId,
                type: filters.transactionType,
            },
            take: filters.perPage,
            skip: (filters.page - 1) * filters.perPage,
            include: { category: true },
        });
        return transactions.map(this.mapToDomain);
    }
    async getTransactionItem(data) {
        const transaction = await client_2.default.transaction.findUnique({
            where: { id: data.id },
            include: { category: true },
        });
        return transaction ? this.mapToDomain(transaction) : null;
    }
    mapToDomain(transaction) {
        return {
            id: transaction.id,
            description: transaction.description,
            value: transaction.value,
            date: transaction.date,
            type: transaction.type,
            category: {
                id: transaction.category.id,
                name: transaction.category.name,
            },
        };
    }
}
exports.default = new TransactionRepository();
