"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const client_1 = __importDefault(require("../prisma/client"));
const subscriptionRepository_1 = __importDefault(require("../repositories/subscriptionRepository"));
const scheduledTransactionService_1 = __importDefault(require("./scheduledTransactionService"));
const transactionNotifierFactory_1 = __importDefault(require("./transactionNotification/transactionNotifierFactory"));
const merchantNormalizer_1 = require("../utils/merchantNormalizer");
const logger_1 = __importDefault(require("../utils/logger"));
class SubscriptionDetectionService {
    async runDetectionForAllUsers() {
        const userIds = await subscriptionRepository_1.default.getAllUserIds();
        for (const userId of userIds) {
            try {
                await this.detectForUser(userId);
            }
            catch (error) {
                logger_1.default.error(`Subscription detection failed for user ${userId}`, error);
            }
        }
    }
    async getSubscriptions(userId, status) {
        const subscriptions = await subscriptionRepository_1.default.getByUserId(userId, status);
        let totalMonthlyEstimate = 0;
        let totalAnnualEstimate = 0;
        let activeCount = 0;
        let detectedCount = 0;
        for (const s of subscriptions) {
            if (s.status === 'CONFIRMED') {
                activeCount++;
                totalMonthlyEstimate += this.toMonthlyAmount(s.averageAmount, s.frequency);
                totalAnnualEstimate += s.annualCost;
            }
            else if (s.status === 'DETECTED') {
                detectedCount++;
                totalMonthlyEstimate += this.toMonthlyAmount(s.averageAmount, s.frequency);
                totalAnnualEstimate += s.annualCost;
            }
        }
        return {
            totalMonthlyEstimate,
            totalAnnualEstimate,
            activeCount,
            detectedCount,
            subscriptions,
        };
    }
    async confirmSubscription(id, userId) {
        return subscriptionRepository_1.default.updateStatus(id, userId, 'CONFIRMED');
    }
    async dismissSubscription(id, userId) {
        return subscriptionRepository_1.default.updateStatus(id, userId, 'DISMISSED');
    }
    async convertToScheduledTransaction(id, userId, categoryId) {
        const subscription = await subscriptionRepository_1.default.getById(id, userId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        const scheduledId = await scheduledTransactionService_1.default.createScheduledTransaction({
            description: subscription.displayName,
            value: subscription.averageAmount,
            type: 'EXPENSE',
            categoryId,
            scheduleType: subscription.frequency,
            userId,
            dayOfMonth: subscription.frequency === 'MONTHLY' ? subscription.lastChargeDate.getDate() : undefined,
            dayOfWeek: subscription.frequency === 'WEEKLY' ? subscription.lastChargeDate.getDay() : undefined,
        });
        return subscriptionRepository_1.default.linkScheduledTransaction(id, userId, scheduledId);
    }
    async getDashboardSnapshot(userId) {
        return subscriptionRepository_1.default.getSnapshotByUserId(userId);
    }
    async sendMonthlyAuditNotifications() {
        const allActive = await subscriptionRepository_1.default.getActiveForAllUsers();
        const byUser = new Map();
        for (const sub of allActive) {
            const existing = byUser.get(sub.userId) || [];
            existing.push(sub);
            byUser.set(sub.userId, existing);
        }
        const userIds = Array.from(byUser.keys());
        const allPrefs = await client_1.default.userNotificationPreference.findMany({
            where: { userId: { in: userIds }, subscriptionAudit: true },
        });
        const enabledUserIds = new Set(allPrefs.map((p) => p.userId));
        const notifier = transactionNotifierFactory_1.default.getNotifier();
        for (const [userId, subs] of byUser) {
            try {
                if (!enabledUserIds.has(userId))
                    continue;
                const confirmed = subs.filter((s) => s.status === 'CONFIRMED');
                const detected = subs.filter((s) => s.status === 'DETECTED');
                if (confirmed.length === 0 && detected.length === 0)
                    continue;
                const now = new Date();
                const monthName = now.toLocaleString('en-US', { month: 'long' });
                const year = now.getFullYear();
                const lines = [`Subscription Audit — ${monthName} ${year}`, ''];
                if (confirmed.length > 0) {
                    lines.push('Active Subscriptions:');
                    let totalMonthly = 0;
                    let totalAnnual = 0;
                    for (const sub of confirmed) {
                        const monthly = this.toMonthlyAmount(sub.averageAmount, sub.frequency);
                        totalMonthly += monthly;
                        totalAnnual += sub.annualCost;
                        lines.push(`- ${sub.displayName}: $${monthly.toFixed(2)}/mo ($${sub.annualCost.toFixed(2)}/yr)`);
                    }
                    lines.push('');
                    lines.push(`Total: $${totalMonthly.toFixed(2)}/month | $${totalAnnual.toFixed(2)}/year`);
                }
                if (detected.length > 0) {
                    lines.push(`${detected.length} new subscription${detected.length > 1 ? 's' : ''} detected — review in app`);
                }
                await notifier.sendDailySummary(lines.join('\n'), userId);
            }
            catch (error) {
                logger_1.default.error(`Failed to send subscription audit for user ${userId}`, error);
            }
        }
    }
    async detectForUser(userId) {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const transactions = await client_1.default.transaction.findMany({
            where: {
                userId,
                type: 'EXPENSE',
                status: 'APPROVED',
                date: { gte: twelveMonthsAgo },
            },
            orderBy: { date: 'asc' },
        });
        const groups = this.groupByMerchant(transactions);
        const dismissed = await subscriptionRepository_1.default.getDismissedMerchants(userId);
        const dismissedSet = new Set(dismissed.map((d) => `${d.merchantName}:${d.frequency}`));
        for (const group of groups) {
            if (group.dates.length < 3)
                continue;
            const pattern = this.analyzePattern(group);
            if (!pattern)
                continue;
            if (dismissedSet.has(`${pattern.merchantKey}:${pattern.frequency}`)) {
                continue;
            }
            await subscriptionRepository_1.default.upsert({
                userId,
                merchantName: pattern.merchantKey,
                displayName: pattern.displayName,
                averageAmount: pattern.averageAmount,
                frequency: pattern.frequency,
                lastChargeDate: pattern.lastChargeDate,
                nextExpectedDate: pattern.nextExpectedDate,
                annualCost: pattern.annualCost,
                matchingDescriptions: pattern.descriptions,
                confidence: pattern.confidence,
            });
        }
    }
    groupByMerchant(transactions) {
        const groups = new Map();
        for (const tx of transactions) {
            const key = (0, merchantNormalizer_1.normalizeMerchantName)(tx.description);
            if (!key)
                continue;
            const existing = groups.get(key);
            if (existing) {
                existing.descriptions.push(tx.description);
                existing.amounts.push(tx.value);
                existing.dates.push(tx.date);
            }
            else {
                groups.set(key, {
                    merchantKey: key,
                    descriptions: [tx.description],
                    amounts: [tx.value],
                    dates: [tx.date],
                });
            }
        }
        return Array.from(groups.values());
    }
    analyzePattern(group) {
        const sortedDates = [...group.dates].sort((a, b) => a.getTime() - b.getTime());
        const intervals = [];
        for (let i = 1; i < sortedDates.length; i++) {
            const diffDays = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
                (1000 * 60 * 60 * 24);
            intervals.push(diffDays);
        }
        if (intervals.length === 0)
            return null;
        const sorted = [...intervals].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        const variance = intervals.reduce((sum, v) => sum + Math.pow(v - median, 2), 0) /
            intervals.length;
        const stddev = Math.sqrt(variance);
        const frequency = this.classifyFrequency(median);
        if (!frequency)
            return null;
        if (median > 0 && stddev / median > 0.3)
            return null;
        const confidence = Math.max(0, Math.min(1, 1 - stddev / median));
        const averageAmount = group.amounts.reduce((sum, a) => sum + a, 0) / group.amounts.length;
        const lastChargeDate = sortedDates[sortedDates.length - 1];
        const nextExpectedDate = this.calculateNextExpectedDate(lastChargeDate, frequency);
        const annualCost = this.calculateAnnualCost(averageAmount, frequency);
        const displayName = this.pickDisplayName(group.descriptions);
        return {
            merchantKey: group.merchantKey,
            displayName,
            frequency,
            averageAmount: Math.round(averageAmount * 100) / 100,
            lastChargeDate,
            nextExpectedDate,
            annualCost: Math.round(annualCost * 100) / 100,
            descriptions: [...new Set(group.descriptions)],
            confidence: Math.round(confidence * 100) / 100,
        };
    }
    classifyFrequency(medianDays) {
        if (medianDays >= 5 && medianDays <= 9)
            return 'WEEKLY';
        if (medianDays >= 25 && medianDays <= 35)
            return 'MONTHLY';
        if (medianDays >= 340 && medianDays <= 395)
            return 'YEARLY';
        return null;
    }
    calculateNextExpectedDate(lastDate, frequency) {
        switch (frequency) {
            case 'WEEKLY':
                return (0, date_fns_1.addWeeks)(lastDate, 1);
            case 'MONTHLY':
                return (0, date_fns_1.addMonths)(lastDate, 1);
            case 'YEARLY':
                return (0, date_fns_1.addYears)(lastDate, 1);
        }
    }
    calculateAnnualCost(amount, frequency) {
        switch (frequency) {
            case 'WEEKLY':
                return amount * 52;
            case 'MONTHLY':
                return amount * 12;
            case 'YEARLY':
                return amount;
        }
    }
    toMonthlyAmount(amount, frequency) {
        switch (frequency) {
            case 'WEEKLY':
                return (amount * 52) / 12;
            case 'MONTHLY':
                return amount;
            case 'YEARLY':
                return amount / 12;
        }
    }
    pickDisplayName(descriptions) {
        const descriptionCounts = new Map();
        for (const desc of descriptions) {
            const trimmed = desc.trim();
            descriptionCounts.set(trimmed, (descriptionCounts.get(trimmed) || 0) + 1);
        }
        let mostCommon = descriptions[0];
        let maxCount = 0;
        for (const [desc, count] of descriptionCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = desc;
            }
        }
        return (0, merchantNormalizer_1.toDisplayName)(mostCommon);
    }
}
exports.default = new SubscriptionDetectionService();
