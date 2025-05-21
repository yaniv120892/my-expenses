import userRepository from '../repositories/userRepository';

class UserSettingsService {
  public getUsersRequiredDailySummary() {
    return userRepository.getUsersRequiredDailySummary();
  }

  public async isCreateTransactionNotificationEnabled(userId: string) {
    return userRepository.isCreateTransactionNotificationEnabled(userId);
  }

  public async getUserSettings(userId: string) {
    return userRepository.getUserSettings(userId);
  }

  public async updateUserSettings(
    userId: string,
    settings: {
      info: { email: string };
      notifications: { createTransaction: boolean; dailySummary: boolean };
    },
  ) {
    await userRepository.updateUserSettings(userId, settings.notifications);
  }
}

export default new UserSettingsService();
