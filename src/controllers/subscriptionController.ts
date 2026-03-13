import logger from '../utils/logger';
import subscriptionDetectionService from '../services/subscriptionDetectionService';
import { SubscriptionStatus } from '@prisma/client';
import { ConvertSubscriptionRequest } from './requests';

class SubscriptionController {
  public async list(userId: string, status?: string) {
    try {
      logger.debug('Start list subscriptions', { userId, status });
      const validStatus = this.parseStatus(status);
      const result = await subscriptionDetectionService.getSubscriptions(
        userId,
        validStatus,
      );
      logger.debug('Done list subscriptions', { count: result.subscriptions.length });
      return result;
    } catch (error: any) {
      logger.error(`Failed to list subscriptions, ${error.message}`);
      throw error;
    }
  }

  public async confirm(id: string, userId: string) {
    try {
      logger.debug('Start confirm subscription', { id, userId });
      const result = await subscriptionDetectionService.confirmSubscription(
        id,
        userId,
      );
      logger.debug('Done confirm subscription', { id });
      return result;
    } catch (error: any) {
      logger.error(`Failed to confirm subscription ${id}, ${error.message}`);
      throw error;
    }
  }

  public async dismiss(id: string, userId: string) {
    try {
      logger.debug('Start dismiss subscription', { id, userId });
      const result = await subscriptionDetectionService.dismissSubscription(
        id,
        userId,
      );
      logger.debug('Done dismiss subscription', { id });
      return result;
    } catch (error: any) {
      logger.error(`Failed to dismiss subscription ${id}, ${error.message}`);
      throw error;
    }
  }

  public async convert(
    id: string,
    userId: string,
    body: ConvertSubscriptionRequest,
  ) {
    try {
      logger.debug('Start convert subscription', { id, userId, body });
      const result =
        await subscriptionDetectionService.convertToScheduledTransaction(
          id,
          userId,
          body.categoryId,
        );
      logger.debug('Done convert subscription', { id });
      return result;
    } catch (error: any) {
      logger.error(`Failed to convert subscription ${id}, ${error.message}`);
      throw error;
    }
  }

  private parseStatus(status?: string): SubscriptionStatus | undefined {
    if (!status) return undefined;
    const upper = status.toUpperCase();
    if (['DETECTED', 'CONFIRMED', 'DISMISSED'].includes(upper)) {
      return upper as SubscriptionStatus;
    }
    return undefined;
  }
}

export default new SubscriptionController();
