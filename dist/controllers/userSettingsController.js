"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userSettingsService_1 = __importDefault(require("../services/userSettingsService"));
const logger_1 = __importDefault(require("../utils/logger"));
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
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get user settings', { userId, error });
            throw error;
        }
    }
    async updateUserSettings(userId, settings) {
        try {
            await userSettingsService_1.default.updateUserSettings(userId, settings);
        }
        catch (error) {
            logger_1.default.error('Failed to update user settings', { userId, error });
            throw error;
        }
    }
}
exports.default = new UserSettingsController();
