"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("..//prisma/client"));
class TransactionRepository {
    async getTransactionsSummary(filters) {
        const transactions = await client_2.default.transaction.findMany({
            where: {
                date: {
                    gte: filters.startDate,
                    lte: filters.endDate,
                },
                categoryId: filters.categoryId,
                type: filters.transactionType,
                status: filters.status || client_1.TransactionStatus.APPROVED,
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
                date: data.date,
                categoryId: data.categoryId,
                type: data.type,
                status: data.status || client_1.TransactionStatus.APPROVED,
            },
            include: { category: true },
        });
        return transaction.id;
    }
    async getTransactions(filters) {
        const transactions = await client_2.default.transaction.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.startDate && filters.endDate
                ? { date: { gte: filters.startDate, lte: filters.endDate } }
                : filters.startDate
                    ? { date: { gte: filters.startDate } }
                    : filters.endDate
                        ? { date: { lte: filters.endDate } }
                        : {})), (filters.categoryId ? { categoryId: filters.categoryId } : {})), (filters.transactionType ? { type: filters.transactionType } : {})), (filters.searchTerm
                ? { description: { contains: filters.searchTerm } }
                : {})), { status: filters.status || client_1.TransactionStatus.APPROVED }),
            take: filters.perPage,
            skip: (filters.page - 1) * filters.perPage,
            include: { category: true },
            orderBy: { date: 'desc' },
        });
        return transactions.map(this.mapToDomain);
    }
    async getPendingTransactions() {
        const transactions = await client_2.default.transaction.findMany({
            where: { status: client_1.TransactionStatus.PENDING_APPROVAL },
            include: { category: true },
            orderBy: { date: 'desc' },
        });
        return transactions.map(this.mapToDomain);
    }
    async updateTransactionStatus(id, status) {
        const transaction = await client_2.default.transaction.update({
            where: { id },
            data: { status },
        });
        return transaction.id;
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
            status: transaction.status,
            category: {
                id: transaction.category.id,
                name: transaction.category.name,
            },
        };
    }
    async updateTransaction(id, data) {
        const transaction = await client_2.default.transaction.update({
            where: { id },
            data: {
                description: data.description,
                value: data.value,
                date: data.date,
                categoryId: data.categoryId,
                type: data.type,
                status: data.status,
            },
        });
        return transaction.id;
    }
    async deleteTransaction(id) {
        await client_2.default.transaction.delete({
            where: { id },
        });
    }
}
exports.default = new TransactionRepository();
