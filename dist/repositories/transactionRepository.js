"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const date_fns_1 = require("date-fns");
const fuse_js_1 = __importDefault(require("fuse.js"));
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
        const smartSearch = filters.smartSearch !== undefined ? filters.smartSearch : true;
        if (filters.searchTerm && !smartSearch) {
            return this.useStrictSearch(filters, startDate, endDate);
        }
        return this.useSmartSearch(filters, startDate, endDate);
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
            include: {
                category: true,
                files: {
                    where: { status: 'ACTIVE' },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return transaction ? this.mapToDomain(transaction) : null;
    }
    mapToDomain(transaction) {
        var _a;
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
            files: ((_a = transaction.files) === null || _a === void 0 ? void 0 : _a.map((file) => ({
                id: file.id,
                transactionId: file.transactionId,
                fileName: file.fileName,
                fileKey: file.fileKey,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
                status: file.status,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
            }))) || [],
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
    async findPotentialMatches(userId, date, value, tolerance = 2, dayRange = 2) {
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - dayRange);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + dayRange);
        const potentialTransactions = await client_2.default.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
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
    async useStrictSearch(filters, startDate, endDate) {
        const transactions = await client_2.default.transaction.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.startDate && filters.endDate
                ? { date: { gte: startDate, lte: endDate } }
                : filters.startDate
                    ? { date: { gte: startDate } }
                    : filters.endDate
                        ? { date: { lte: endDate } }
                        : {})), (filters.categoryId ? { categoryId: filters.categoryId } : {})), (filters.transactionType ? { type: filters.transactionType } : {})), { description: { contains: filters.searchTerm }, status: filters.status || client_1.TransactionStatus.APPROVED, userId: filters.userId }),
            include: { category: true },
            orderBy: { date: 'desc' },
            skip: (filters.page - 1) * filters.perPage,
            take: filters.perPage,
        });
        return transactions.map(this.mapToDomain);
    }
    async useSmartSearch(filters, startDate, endDate) {
        var _a;
        const transactions = await client_2.default.transaction.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.startDate && filters.endDate
                ? { date: { gte: startDate, lte: endDate } }
                : filters.startDate
                    ? { date: { gte: startDate } }
                    : filters.endDate
                        ? { date: { lte: endDate } }
                        : {})), (filters.categoryId ? { categoryId: filters.categoryId } : {})), (filters.transactionType ? { type: filters.transactionType } : {})), { status: filters.status || client_1.TransactionStatus.APPROVED, userId: filters.userId }),
            include: { category: true },
            orderBy: { date: 'desc' },
        });
        let filtered = transactions;
        if (filters.searchTerm && ((_a = filters.smartSearch) !== null && _a !== void 0 ? _a : true)) {
            const fuse = new fuse_js_1.default(transactions, {
                keys: ['description'],
                threshold: 0.8,
                ignoreLocation: true,
                minMatchCharLength: 2,
            });
            filtered = fuse.search(filters.searchTerm).map((result) => result.item);
        }
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const paginated = filtered.slice((page - 1) * perPage, page * perPage);
        return paginated.map(this.mapToDomain);
    }
}
exports.default = new TransactionRepository();
