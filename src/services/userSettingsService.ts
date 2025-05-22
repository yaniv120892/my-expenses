import { JsonValue } from '@prisma/client/runtime/library';
import userRepository from '../repositories/userRepository';

class UserSettingsService {
  public getUsersRequiredDailySummary() {
    return userRepository.getUsersRequiredDailySummary();
  }

  public async isCreateTransactionNotificationEnabled(userId: string) {
    return userRepository.isCreateTransactionNotificationEnabled(userId);
  }

  public async getUserSettings(userId: string) {
    const userSettings = await userRepository.getUserSettings(userId);
    if (!userSettings) {
      return null;
    }

    return {
      info: {
        email: userSettings.info.email,
      },
      notifications: {
        createTransaction: userSettings.notifications.createTransaction,
        dailySummary: userSettings.notifications.dailySummary,
      },
      provider: {
        enabled: userSettings.providers[0]?.enabled ?? false,
        telegramChatId:
          this.extractChatId(userSettings.providers[0]?.data) ?? null,
      },
    };
  }

  public async updateUserSettings(
    userId: string,
    settings: {
      info: { email: string };
      notifications: { createTransaction: boolean; dailySummary: boolean };
      provider: {
        enabled: boolean;
        chatId: string;
      };
    },
  ) {
    const providers = [
      {
        provider: 'TELEGRAM' as const,
        enabled: settings.provider.enabled,
        data: {
          chatId: settings.provider.chatId,
        },
      },
    ];
    await userRepository.updateUserSettings(
      userId,
      settings.notifications,
      providers,
    );
  }

  private extractChatId(providerData: JsonValue): string | null {
    if (
      providerData &&
      typeof providerData === 'object' &&
      'chatId' in providerData
    ) {
      const chatId = (providerData as { chatId: string }).chatId;
      return chatId ? String(chatId) : null;
    }
    return null;
  }
}

export default new UserSettingsService();
