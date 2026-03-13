"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const subscriptionDetectionService_1 = __importDefault(require("../services/subscriptionDetectionService"));
class SubscriptionController {
    async list(userId, status) {
        try {
            logger_1.default.debug('Start list subscriptions', { userId, status });
            const validStatus = this.parseStatus(status);
            const result = await subscriptionDetectionService_1.default.getSubscriptions(userId, validStatus);
            logger_1.default.debug('Done list subscriptions', { count: result.subscriptions.length });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to list subscriptions, ${error.message}`);
            throw error;
        }
    }
    async confirm(id, userId) {
        try {
            logger_1.default.debug('Start confirm subscription', { id, userId });
            const result = await subscriptionDetectionService_1.default.confirmSubscription(id, userId);
            logger_1.default.debug('Done confirm subscription', { id });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to confirm subscription ${id}, ${error.message}`);
            throw error;
        }
    }
    async dismiss(id, userId) {
        try {
            logger_1.default.debug('Start dismiss subscription', { id, userId });
            const result = await subscriptionDetectionService_1.default.dismissSubscription(id, userId);
            logger_1.default.debug('Done dismiss subscription', { id });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to dismiss subscription ${id}, ${error.message}`);
            throw error;
        }
    }
    async convert(id, userId, body) {
        try {
            logger_1.default.debug('Start convert subscription', { id, userId, body });
            const result = await subscriptionDetectionService_1.default.convertToScheduledTransaction(id, userId, body.categoryId);
            logger_1.default.debug('Done convert subscription', { id });
            return result;
        }
        catch (error) {
            logger_1.default.error(`Failed to convert subscription ${id}, ${error.message}`);
            throw error;
        }
    }
    parseStatus(status) {
        if (!status)
            return undefined;
        const upper = status.toUpperCase();
        if (['DETECTED', 'CONFIRMED', 'DISMISSED'].includes(upper)) {
            return upper;
        }
        return undefined;
    }
}
exports.default = new SubscriptionController();
