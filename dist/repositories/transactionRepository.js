"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const date_fns_1 = require("date-fns");
class TransactionRepository {
    async getTransactionsSummary(filters) {
        const { startDate, endDate } = this.getNormalizedDateRange(filters.startDate, filters.endDate);
        const transactions = await client_2.default.transaction.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                categoryId: filters.categoryId,
                type: filters.transactionType,
                status: filters.status || client_1.TransactionStatus.APPROVED,
                userId: filters.userId,
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
                userId: data.userId,
            },
            include: { category: true },
        });
        return transaction.id;
    }
    async getTransactions(filters) {
        const { startDate, endDate } = this.getNormalizedDateRange(filters.startDate, filters.endDate);
        const transactions = await client_2.default.transaction.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.startDate && filters.endDate
                ? { date: { gte: startDate, lte: endDate } }
                : filters.startDate
                    ? { date: { gte: startDate } }
                    : filters.endDate
                        ? { date: { lte: endDate } }
                        : {})), (filters.categoryId ? { categoryId: filters.categoryId } : {})), (filters.transactionType ? { type: filters.transactionType } : {})), (filters.searchTerm
                ? { description: { contains: filters.searchTerm } }
                : {})), { status: filters.status || client_1.TransactionStatus.APPROVED, userId: filters.userId }),
            take: filters.perPage,
            skip: (filters.page - 1) * filters.perPage,
            include: { category: true },
            orderBy: { date: 'desc' },
        });
        return transactions.map(this.mapToDomain);
    }
    async getPendingTransactions(userId) {
        const transactions = await client_2.default.transaction.findMany({
            where: { status: client_1.TransactionStatus.PENDING_APPROVAL, userId: userId },
            include: { category: true },
            orderBy: { date: 'desc' },
        });
        return transactions.map(this.mapToDomain);
    }
    async updateTransactionStatus(id, status, userId) {
        const transaction = await client_2.default.transaction.update({
            where: { id, userId },
            data: { status },
        });
        return transaction.id;
    }
    async getTransactionItem(transactionId, userId) {
        const transaction = await client_2.default.transaction.findUnique({
            where: { id: transactionId, userId },
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
    async updateTransaction(id, data, userId) {
        const transaction = await client_2.default.transaction.update({
            where: { id, userId },
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
    async deleteTransaction(id, userId) {
        await client_2.default.transaction.delete({
            where: { id, userId },
        });
    }
    getNormalizedDateRange(startDate, endDate) {
        let normalizedStartDate = startDate
            ? (0, date_fns_1.startOfDay)(new Date(startDate))
            : undefined;
        let normalizedEndDate = endDate ? (0, date_fns_1.endOfDay)(new Date(endDate)) : undefined;
        return { startDate: normalizedStartDate, endDate: normalizedEndDate };
    }
    async findPotentialMatches(userId, date, value, tolerance = 5, dayRange = 1) {
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - dayRange);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + dayRange);
        const potentialTransactions = await client_2.default.transaction.findMany({
            where: {
                userId,
                date: {
                    equals: date,
                },
                value: {
                    gte: value - tolerance,
                    lte: value + tolerance,
                },
                status: client_1.TransactionStatus.APPROVED,
            },
            include: { category: true },
        });
        return potentialTransactions.map(this.mapToDomain);
    }
}
exports.default = new TransactionRepository();
