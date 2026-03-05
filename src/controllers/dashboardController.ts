import { Request } from 'express';
import dashboardService from '../services/dashboardService';
import logger from '../utils/logger';

class DashboardController {
  async getDashboard(request: Request) {
    const userId = request.userId as string;
    logger.debug('Start get dashboard');
    const dashboard = await dashboardService.getDashboard(userId);
    logger.debug('Done get dashboard');
    return dashboard;
  }

  async getInsights(request: Request) {
    const userId = request.userId as string;
    logger.debug('Start get dashboard insights');
    const insights = await dashboardService.getInsights(userId);
    logger.debug('Done get dashboard insights');
    return insights;
  }
}

export default new DashboardController();
