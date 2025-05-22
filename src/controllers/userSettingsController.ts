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

  public async testTelegram(chatId: string) {
    try {
      logger.debug('Start sending test telegram message', { chatId });
      await telegramService.sendMessage(chatId, 'test my expenses connection');
      logger.debug('Done sending test telegram message', { chatId });
      return {
        success: true,
        message: 'Test telegram message sent successfully',
      };
    } catch (error) {
      logger.error('Failed to send test telegram message', { chatId, error });
      const errorMessage = this.extractTestTelegramFailureMessage(error);
      return {
        success: false,
        message: `Failed to send test telegram message, ${errorMessage}`,
      };
    }
  }

  private extractTestTelegramFailureMessage(
    error: unknown,
  ): string | undefined {
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('chat not found')) {
        return 'Chat not found. Please check your chat ID.';
      }
    }
    return 'Unknown error. Please check your chat ID.';
  }
}

export default new UserSettingsController();
