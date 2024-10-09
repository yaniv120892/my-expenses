"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("..//prisma/client"));
class TransactionRepository {
    getTransactionsSummary(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield client_2.default.transaction.findMany({
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
        });
    }
    createTransaction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield client_2.default.transaction.create({
                data: {
                    description: data.description,
                    value: data.value,
                    date: new Date(),
                    categoryId: data.categoryId,
                    type: data.type,
                },
                include: { category: true },
            });
            return transaction.id;
        });
    }
    getTransactions(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield client_2.default.transaction.findMany({
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
        });
    }
    getTransactionItem(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield client_2.default.transaction.findUnique({
                where: { id: data.id },
                include: { category: true },
            });
            return transaction ? this.mapToDomain(transaction) : null;
        });
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
