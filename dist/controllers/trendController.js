"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const trendService_1 = __importDefault(require("../services/trendService"));
class TrendController {
    async getSpendingTrends(request) {
        try {
            const userId = request.userId;
            const { startDate, endDate, period, categoryId, transactionType } = request.query;
            const trendRequest = {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                period: period || 'monthly',
                categoryId: categoryId,
                transactionType: transactionType,
            };
            logger_1.default.debug('Start get spending trends', trendRequest);
            const trends = await trendService_1.default.getSpendingTrends(trendRequest, userId);
            logger_1.default.debug('Done get spending trends', trends);
            return trends;
        }
        catch (error) {
            logger_1.default.error(`Failed to get spending trends, ${error.message}`);
            throw error;
        }
    }
    async getCategorySpendingTrends(request) {
        try {
            const userId = request.userId;
            const { startDate, endDate, period, transactionType } = request.query;
            const trendRequest = {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                period: period || 'monthly',
                transactionType: transactionType,
            };
            logger_1.default.debug('Start get category spending trends', trendRequest);
            const trends = await trendService_1.default.getCategorySpendingTrends(trendRequest, userId);
            logger_1.default.debug('Done get category spending trends', trends);
            return trends;
        }
        catch (error) {
            logger_1.default.error(`Failed to get category spending trends, ${error.message}`);
            throw error;
        }
    }
}
exports.default = new TrendController();
