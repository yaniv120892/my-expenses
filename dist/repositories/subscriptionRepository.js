"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class SubscriptionRepository {
    async getByUserId(userId, status) {
        const subscriptions = await client_1.default.detectedSubscription.findMany({
            where: Object.assign({ userId }, (status ? { status } : {})),
            orderBy: { updatedAt: 'desc' },
        });
        return subscriptions.map(this.mapToDomain);
    }
    async upsert(data) {
        const result = await client_1.default.detectedSubscription.upsert({
            where: {
                userId_merchantName_frequency: {
                    userId: data.userId,
                    merchantName: data.merchantName,
                    frequency: data.frequency,
                },
            },
            update: {
                displayName: data.displayName,
                averageAmount: data.averageAmount,
                lastChargeDate: data.lastChargeDate,
                nextExpectedDate: data.nextExpectedDate,
                annualCost: data.annualCost,
                matchingDescriptions: data.matchingDescriptions,
                confidence: data.confidence,
            },
            create: {
                userId: data.userId,
                merchantName: data.merchantName,
                displayName: data.displayName,
                averageAmount: data.averageAmount,
                frequency: data.frequency,
                lastChargeDate: data.lastChargeDate,
                nextExpectedDate: data.nextExpectedDate,
                annualCost: data.annualCost,
                matchingDescriptions: data.matchingDescriptions,
                confidence: data.confidence,
            },
        });
        return this.mapToDomain(result);
    }
    async updateStatus(id, userId, status) {
        const result = await client_1.default.detectedSubscription.update({
            where: { id, userId },
            data: { status },
        });
        return this.mapToDomain(result);
    }
    async linkScheduledTransaction(id, userId, scheduledTransactionId) {
        const result = await client_1.default.detectedSubscription.update({
            where: { id, userId },
            data: { scheduledTransactionId, status: 'CONFIRMED' },
        });
        return this.mapToDomain(result);
    }
    async getById(id, userId) {
        const result = await client_1.default.detectedSubscription.findUnique({
            where: { id, userId },
        });
        return result ? this.mapToDomain(result) : null;
    }
    async getDismissedMerchants(userId) {
        const dismissed = await client_1.default.detectedSubscription.findMany({
            where: { userId, status: 'DISMISSED' },
            select: { merchantName: true, frequency: true },
        });
        return dismissed;
    }
    async getAllUserIds() {
        const users = await client_1.default.user.findMany({
            select: { id: true },
        });
        return users.map((u) => u.id);
    }
    async getSnapshotByUserId(userId) {
        const subscriptions = await client_1.default.detectedSubscription.findMany({
            where: {
                userId,
                status: { in: ['CONFIRMED', 'DETECTED'] },
            },
            select: {
                status: true,
                averageAmount: true,
                annualCost: true,
                frequency: true,
            },
        });
        let activeCount = 0;
        let detectedCount = 0;
        let totalMonthlyEstimate = 0;
        let totalAnnualEstimate = 0;
        for (const s of subscriptions) {
            const monthly = s.frequency === 'WEEKLY'
                ? (s.averageAmount * 52) / 12
                : s.frequency === 'YEARLY'
                    ? s.averageAmount / 12
                    : s.averageAmount;
            totalMonthlyEstimate += monthly;
            totalAnnualEstimate += s.annualCost;
            if (s.status === 'CONFIRMED')
                activeCount++;
            else
                detectedCount++;
        }
        return { activeCount, totalMonthlyEstimate, totalAnnualEstimate, detectedCount };
    }
    async getActiveForAllUsers() {
        const subscriptions = await client_1.default.detectedSubscription.findMany({
            where: {
                status: { in: ['DETECTED', 'CONFIRMED'] },
            },
            orderBy: { userId: 'asc' },
        });
        return subscriptions.map(this.mapToDomain);
    }
    mapToDomain(db) {
        var _a;
        return {
            id: db.id,
            userId: db.userId,
            merchantName: db.merchantName,
            displayName: db.displayName,
            averageAmount: db.averageAmount,
            frequency: db.frequency,
            lastChargeDate: db.lastChargeDate,
            nextExpectedDate: db.nextExpectedDate,
            annualCost: db.annualCost,
            status: db.status,
            matchingDescriptions: db.matchingDescriptions,
            scheduledTransactionId: (_a = db.scheduledTransactionId) !== null && _a !== void 0 ? _a : undefined,
            confidence: db.confidence,
            createdAt: db.createdAt,
            updatedAt: db.updatedAt,
        };
    }
}
exports.default = new SubscriptionRepository();
