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
            const nextRunDate = this.calculateNextRunDate(scheduled.scheduleType, scheduled.interval, date, scheduled.dayOfWeek, scheduled.dayOfMonth);
            await scheduledTransactionRepository_1.default.updateLastRunAndNextRun(scheduled.id, date, nextRunDate);
        }
    }
    calculateNextRunDate(scheduleType, interval, fromDate, dayOfWeek, dayOfMonth) {
        const intervalValue = interval || 1;
        if (scheduleType === 'DAILY') {
            return (0, date_fns_1.addDays)(fromDate, intervalValue);
        }
        if (scheduleType === 'WEEKLY') {
            const baseDate = (0, date_fns_1.addWeeks)(fromDate, intervalValue);
            if (dayOfWeek !== undefined) {
                let next = (0, date_fns_1.setDay)(baseDate, dayOfWeek, { weekStartsOn: 1 });
                if (!(0, date_fns_1.isAfter)(next, fromDate)) {
                    next = (0, date_fns_1.addWeeks)(next, 1);
                }
                return next;
            }
            return baseDate;
        }
        if (scheduleType === 'MONTHLY') {
            const baseDate = (0, date_fns_1.addMonths)(fromDate, intervalValue);
            if (dayOfMonth !== undefined) {
                let next = (0, date_fns_1.setDate)(baseDate, dayOfMonth);
                if (!(0, date_fns_1.isAfter)(next, fromDate)) {
                    next = (0, date_fns_1.addMonths)(next, 1);
                    next = (0, date_fns_1.setDate)(next, dayOfMonth);
                }
                return next;
            }
            return baseDate;
        }
        if (scheduleType === 'YEARLY') {
            return (0, date_fns_1.addYears)(fromDate, intervalValue);
        }
        if (scheduleType === 'CUSTOM') {
            return (0, date_fns_1.addDays)(fromDate, intervalValue);
        }
        return (0, date_fns_1.addDays)(fromDate, 1);
    }
    async createScheduledTransaction(data) {
        const nextRunDate = this.calculateNextRunDate(data.scheduleType, data.interval, new Date(), data.dayOfWeek, data.dayOfMonth);
        return scheduledTransactionRepository_1.default.createScheduledTransaction(data, nextRunDate);
    }
    async updateScheduledTransaction(id, data) {
        const oldScheduledTransaction = await scheduledTransactionRepository_1.default.getScheduledTransactionById(id);
        const nextRunDate = this.calculateNextRunDate(data.scheduleType, data.interval, (oldScheduledTransaction === null || oldScheduledTransaction === void 0 ? void 0 : oldScheduledTransaction.lastRunDate) || new Date(), data.dayOfWeek, data.dayOfMonth);
        return scheduledTransactionRepository_1.default.updateScheduledTransaction(id, data, nextRunDate);
    }
    async listScheduledTransactions() {
        return scheduledTransactionRepository_1.default.getAllScheduledTransactions();
    }
    async deleteScheduledTransaction(id) {
        return scheduledTransactionRepository_1.default.deleteScheduledTransaction(id);
    }
}
exports.default = new ScheduledTransactionService();
