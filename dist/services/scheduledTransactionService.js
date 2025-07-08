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
                userId: scheduled.userId,
            });
            const nextRunDate = this.calculateNextRunDate(scheduled.scheduleType, scheduled.interval, date, scheduled.dayOfWeek, scheduled.dayOfMonth);
            await scheduledTransactionRepository_1.default.updateLastRunAndNextRun(scheduled.id, date, nextRunDate);
        }
    }
    calculateNextRunDate(scheduleType, interval, fromDate, dayOfWeek, dayOfMonth) {
        const intervalValue = interval || 1;
        switch (scheduleType) {
            case 'DAILY':
                return (0, date_fns_1.startOfDay)((0, date_fns_1.addDays)(fromDate, intervalValue));
            case 'WEEKLY': {
                const baseDate = (0, date_fns_1.addWeeks)(fromDate, intervalValue);
                if (dayOfWeek !== undefined) {
                    // Adjust dayOfWeek to account for Sunday as start of week (0-based)
                    const adjustedDayOfWeek = dayOfWeek - 1;
                    let next = (0, date_fns_1.setDay)(baseDate, adjustedDayOfWeek, { weekStartsOn: 0 });
                    if (!(0, date_fns_1.isAfter)(next, fromDate)) {
                        next = (0, date_fns_1.addWeeks)(next, 1);
                    }
                    return (0, date_fns_1.startOfDay)(next);
                }
                return (0, date_fns_1.startOfDay)(baseDate);
            }
            case 'MONTHLY': {
                if (dayOfMonth !== undefined) {
                    const currentMonthDate = (0, date_fns_1.setDate)(new Date(fromDate), dayOfMonth);
                    if ((0, date_fns_1.isAfter)(currentMonthDate, fromDate)) {
                        return (0, date_fns_1.startOfDay)(currentMonthDate);
                    }
                    const nextMonth = (0, date_fns_1.addMonths)(fromDate, intervalValue);
                    return (0, date_fns_1.startOfDay)((0, date_fns_1.setDate)(nextMonth, dayOfMonth));
                }
                return (0, date_fns_1.startOfDay)((0, date_fns_1.addMonths)(fromDate, intervalValue));
            }
            case 'YEARLY':
                return (0, date_fns_1.startOfDay)((0, date_fns_1.addYears)(fromDate, intervalValue));
            case 'CUSTOM':
                return (0, date_fns_1.startOfDay)((0, date_fns_1.addDays)(fromDate, intervalValue));
            default:
                return (0, date_fns_1.startOfDay)((0, date_fns_1.addDays)(fromDate, 1));
        }
    }
    async createScheduledTransaction(data) {
        const nextRunDate = this.calculateNextRunDate(data.scheduleType, data.interval, new Date(), data.dayOfWeek, data.dayOfMonth);
        return scheduledTransactionRepository_1.default.createScheduledTransaction(data, nextRunDate);
    }
    async updateScheduledTransaction(id, data, userId) {
        const oldScheduledTransaction = await scheduledTransactionRepository_1.default.getScheduledTransactionById(id, userId);
        const nextRunDate = this.calculateNextRunDate(data.scheduleType, data.interval, (oldScheduledTransaction === null || oldScheduledTransaction === void 0 ? void 0 : oldScheduledTransaction.lastRunDate) || new Date(), data.dayOfWeek, data.dayOfMonth);
        return scheduledTransactionRepository_1.default.updateScheduledTransaction(id, data, userId, nextRunDate);
    }
    async listScheduledTransactions(userId) {
        return scheduledTransactionRepository_1.default.getAllScheduledTransactions(userId);
    }
    async deleteScheduledTransaction(id, userId) {
        return scheduledTransactionRepository_1.default.deleteScheduledTransaction(id, userId);
    }
}
exports.default = new ScheduledTransactionService();
