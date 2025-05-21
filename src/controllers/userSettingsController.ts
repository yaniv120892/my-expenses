import { Request } from 'express';
import userSettingsService from '../services/userSettingsService';
import { UserSettingsResponse, UpdateUserSettingsRequest } from './requests';
import logger from '../utils/logger';

class UserSettingsController {
  public async getUserSettings(userId: string): Promise<UserSettingsResponse> {
    try {
      const userSettings = await userSettingsService.getUserSettings(userId);
      if (!userSettings) {
        throw new Error('User settings not found');
      }
      return {
        info: { email: userSettings.info.email },
        notifications: {
          createTransaction: userSettings.notifications.createTransaction,
          dailySummary: userSettings.notifications.dailySummary,
        },
      };
    } catch (error) {
      logger.error('Failed to get user settings', { userId, error });
      throw error;
    }
  }

  public async updateUserSettings(
    userId: string,
    settings: UpdateUserSettingsRequest,
  ) {
    try {
      await userSettingsService.updateUserSettings(userId, settings);
    } catch (error) {
      logger.error('Failed to update user settings', { userId, error });
      throw error;
    }
  }
}

export default new UserSettingsController();
