"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scheduledTransactionRepository_1 = __importDefault(require("../repositories/scheduledTransactionRepository"));
const transactionService_1 = __importDefault(require("./transactionService"));
const date_fns_1 = require("date-fns");
class ScheduledTransactionService {
    async processDueScheduledTransactions(date) {
        const dueScheduledTransactions = await scheduledTransactionRepository_1.default.getDueScheduledTransactions(date);
        for (const scheduled of dueScheduledTransactions) {
            await transactionService_1.default.createTransaction({
                description: scheduled.description,
                value: scheduled.value,
                categoryId: scheduled.categoryId,
                type: scheduled.type,
                date,
                status: 'PENDING_APPROVAL',
            });
            const nextRunDate = this.calculateNextRunDate(scheduled.scheduleType, scheduled.interval, date);
            await scheduledTransactionRepository_1.default.updateLastRunAndNextRun(scheduled.id, date, nextRunDate);
        }
    }
    calculateNextRunDate(scheduleType, interval, fromDate) {
        switch (scheduleType) {
            case 'DAILY':
                return (0, date_fns_1.addDays)(fromDate, interval || 1);
            case 'WEEKLY':
                return (0, date_fns_1.addWeeks)(fromDate, interval || 1);
            case 'MONTHLY':
                return (0, date_fns_1.addMonths)(fromDate, interval || 1);
            case 'YEARLY':
                return (0, date_fns_1.addYears)(fromDate, interval || 1);
            case 'CUSTOM':
                return (0, date_fns_1.addDays)(fromDate, interval || 1);
            default:
                return (0, date_fns_1.addDays)(fromDate, 1);
        }
    }
    async createScheduledTransaction(data) {
        const nextRunDate = this.calculateNextRunDate(data.scheduleType, data.interval, new Date());
        return scheduledTransactionRepository_1.default.createScheduledTransaction(data, nextRunDate);
    }
    async updateScheduledTransaction(id, data) {
        return scheduledTransactionRepository_1.default.updateScheduledTransaction(id, data);
    }
    async listScheduledTransactions() {
        return scheduledTransactionRepository_1.default.getAllScheduledTransactions();
    }
    async deleteScheduledTransaction(id) {
        return scheduledTransactionRepository_1.default.deleteScheduledTransaction(id);
    }
}
exports.default = new ScheduledTransactionService();
