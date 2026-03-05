"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboardService_1 = __importDefault(require("../services/dashboardService"));
const logger_1 = __importDefault(require("../utils/logger"));
class DashboardController {
    async getDashboard(request) {
        const userId = request.userId;
        logger_1.default.debug('Start get dashboard');
        const dashboard = await dashboardService_1.default.getDashboard(userId);
        logger_1.default.debug('Done get dashboard');
        return dashboard;
    }
    async getInsights(request) {
        const userId = request.userId;
        logger_1.default.debug('Start get dashboard insights');
        const insights = await dashboardService_1.default.getInsights(userId);
        logger_1.default.debug('Done get dashboard insights');
        return insights;
    }
}
exports.default = new DashboardController();
