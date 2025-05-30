"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class ScheduledTransactionRepository {
    async createScheduledTransaction(data, nextRunDate) {
        const scheduledTransaction = await client_1.default.scheduledTransaction.create({
            data: Object.assign(Object.assign({}, data), { interval: data.interval === undefined ? null : data.interval, dayOfWeek: data.dayOfWeek === undefined ? null : data.dayOfWeek, dayOfMonth: data.dayOfMonth === undefined ? null : data.dayOfMonth, monthOfYear: data.monthOfYear === undefined ? null : data.monthOfYear, nextRunDate, userId: data.userId }),
        });
        return scheduledTransaction.id;
    }
    async getAllScheduledTransactions(userId) {
        const scheduledTransactions = await client_1.default.scheduledTransaction.findMany({
            where: {
                userId,
            },
            orderBy: {
                nextRunDate: 'asc',
            },
        });
        return scheduledTransactions.map(this.mapScheduledTransactionDbToDomain);
    }
    async getDueScheduledTransactions(date) {
        const scheduledTransactions = await client_1.default.scheduledTransaction.findMany({
            where: {
                nextRunDate: { lte: date },
            },
        });
        return scheduledTransactions.map(this.mapScheduledTransactionDbToDomain);
    }
    async updateLastRunAndNextRun(id, lastRunDate, nextRunDate) {
        await client_1.default.scheduledTransaction.update({
            where: { id },
            data: { lastRunDate, nextRunDate },
        });
    }
    async updateScheduledTransaction(id, data, userId, nextRunDate) {
        const scheduledTransaction = await client_1.default.scheduledTransaction.update({
            where: { id, userId },
            data: Object.assign(Object.assign({}, data), { interval: data.interval === undefined ? null : data.interval, dayOfWeek: data.dayOfWeek === undefined ? null : data.dayOfWeek, dayOfMonth: data.dayOfMonth === undefined ? null : data.dayOfMonth, monthOfYear: data.monthOfYear === undefined ? null : data.monthOfYear, nextRunDate }),
        });
        return scheduledTransaction.id;
    }
    async deleteScheduledTransaction(id, userId) {
        await client_1.default.scheduledTransaction.delete({ where: { id, userId } });
    }
    async getScheduledTransactionById(id, userId) {
        const scheduledTransaction = await client_1.default.scheduledTransaction.findUnique({
            where: { id, userId },
        });
        if (!scheduledTransaction) {
            return null;
        }
        return this.mapScheduledTransactionDbToDomain(scheduledTransaction);
    }
    mapScheduledTransactionDbToDomain(db) {
        return {
            id: db.id,
            description: db.description,
            value: db.value,
            type: db.type,
            categoryId: db.categoryId,
            scheduleType: db.scheduleType,
            interval: db.interval === null ? undefined : db.interval,
            dayOfWeek: db.dayOfWeek === null ? undefined : db.dayOfWeek,
            dayOfMonth: db.dayOfMonth === null ? undefined : db.dayOfMonth,
            monthOfYear: db.monthOfYear === null ? undefined : db.monthOfYear,
            lastRunDate: db.lastRunDate === null ? undefined : db.lastRunDate,
            nextRunDate: db.nextRunDate === null ? undefined : db.nextRunDate,
            userId: db.userId,
        };
    }
}
exports.default = new ScheduledTransactionRepository();
