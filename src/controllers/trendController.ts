import { Request } from 'express';
import logger from '../utils/logger';
import trendService from '../services/trendService';
import { GetSpendingTrendsRequest } from '../types/trends';
import { TransactionType } from '@prisma/client';

class TrendController {
  async getSpendingTrends(request: Request) {
    try {
      const userId = request.userId as string;
      const { startDate, endDate, period, categoryId, transactionType } =
        request.query;

      const trendRequest: GetSpendingTrendsRequest = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: (period as GetSpendingTrendsRequest['period']) || 'monthly',
        categoryId: categoryId as string | undefined,
        transactionType: transactionType as TransactionType | undefined,
      };

      logger.debug('Start get spending trends', trendRequest);
      const trends = await trendService.getSpendingTrends(trendRequest, userId);
      logger.debug('Done get spending trends', trends);
      return trends;
    } catch (error: any) {
      logger.error(`Failed to get spending trends, ${error.message}`);
      throw error;
    }
  }

  async getCategorySpendingTrends(request: Request) {
    try {
      const userId = request.userId as string;
      const { startDate, endDate, period, transactionType } = request.query;

      const trendRequest: GetSpendingTrendsRequest = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: (period as GetSpendingTrendsRequest['period']) || 'monthly',
        transactionType: transactionType as TransactionType | undefined,
      };

      logger.debug('Start get category spending trends', trendRequest);
      const trends = await trendService.getCategorySpendingTrends(
        trendRequest,
        userId,
      );
      logger.debug('Done get category spending trends', trends);
      return trends;
    } catch (error: any) {
      logger.error(`Failed to get category spending trends, ${error.message}`);
      throw error;
    }
  }
}

export default new TrendController();
