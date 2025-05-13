"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class ScheduledTransactionRepository {
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
        };
    }
    async createScheduledTransaction(data) {
        const scheduledTransaction = await client_1.default.scheduledTransaction.create({
            data,
        });
        return scheduledTransaction.id;
    }
    async getAllScheduledTransactions() {
        const scheduledTransactions = await client_1.default.scheduledTransaction.findMany();
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
    async updateScheduledTransaction(id, data) {
        const scheduledTransaction = await client_1.default.scheduledTransaction.update({
            where: { id },
            data,
        });
        return scheduledTransaction.id;
    }
    async deleteScheduledTransaction(id) {
        await client_1.default.scheduledTransaction.delete({ where: { id } });
    }
}
exports.default = new ScheduledTransactionRepository();
