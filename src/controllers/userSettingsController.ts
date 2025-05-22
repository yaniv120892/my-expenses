import userSettingsService from '../services/userSettingsService';
import { UserSettingsResponse, UpdateUserSettingsRequest } from './requests';
import logger from '../utils/logger';
import { telegramService } from '../services/telegramService';
import { log } from 'winston';

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
        provider: {
          enabled: userSettings.provider.enabled,
          telegramChatId: userSettings.provider.telegramChatId,
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
      await userSettingsService.updateUserSettings(userId, {
        info: { email: settings.info.email },
        notifications: {
          createTransaction: settings.notifications.createTransaction,
          dailySummary: settings.notifications.dailySummary,
        },
        provider: {
          enabled: settings.provider.enabled,
          chatId: settings.provider.telegramChatId || null,
        },
      });
    } catch (error) {
      logger.error('Failed to update user settings', { userId, error });
      throw error;
    }
  }

  public async testTelegram(chatId: number) {
    try {
      logger.debug('Start sending test telegram message', { chatId });
      await telegramService.sendMessage(chatId, 'test my expenses connection');
      logger.debug('Done sending test telegram message', { chatId });
    } catch (error) {
      logger.error('Failed to send test telegram message', { chatId, error });
      throw error;
    }
  }
}

export default new UserSettingsController();
