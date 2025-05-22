"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userSettingsService_1 = __importDefault(require("../services/userSettingsService"));
const logger_1 = __importDefault(require("../utils/logger"));
const telegramService_1 = require("../services/telegramService");
class UserSettingsController {
    async getUserSettings(userId) {
        try {
            const userSettings = await userSettingsService_1.default.getUserSettings(userId);
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
        }
        catch (error) {
            logger_1.default.error('Failed to get user settings', { userId, error });
            throw error;
        }
    }
    async updateUserSettings(userId, settings) {
        try {
            await userSettingsService_1.default.updateUserSettings(userId, {
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
        }
        catch (error) {
            logger_1.default.error('Failed to update user settings', { userId, error });
            throw error;
        }
    }
    async testTelegram(chatId) {
        try {
            logger_1.default.debug('Start sending test telegram message', { chatId });
            await telegramService_1.telegramService.sendMessage(chatId, 'test my expenses connection');
            logger_1.default.debug('Done sending test telegram message', { chatId });
            return {
                success: true,
                message: 'Test telegram message sent successfully',
            };
        }
        catch (error) {
            logger_1.default.error('Failed to send test telegram message', { chatId, error });
            const errorMessage = this.extractTestTelegramFailureMessage(error);
            return {
                success: false,
                message: `Failed to send test telegram message, ${errorMessage}`,
            };
        }
    }
    extractTestTelegramFailureMessage(error) {
        if (error instanceof Error) {
            const message = error.message;
            if (message.includes('chat not found')) {
                return 'Chat not found. Please check your chat ID.';
            }
        }
        return 'Unknown error. Please check your chat ID.';
    }
}
exports.default = new UserSettingsController();
