"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
class UserSettingsService {
    getUsersRequiredDailySummary() {
        return userRepository_1.default.getUsersRequiredDailySummary();
    }
    async isCreateTransactionNotificationEnabled(userId) {
        return userRepository_1.default.isCreateTransactionNotificationEnabled(userId);
    }
    async getUserSettings(userId) {
        var _a, _b, _c, _d;
        const userSettings = await userRepository_1.default.getUserSettings(userId);
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
                enabled: (_b = (_a = userSettings.providers[0]) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : false,
                telegramChatId: (_d = this.extractChatId((_c = userSettings.providers[0]) === null || _c === void 0 ? void 0 : _c.data)) !== null && _d !== void 0 ? _d : null,
            },
        };
    }
    async updateUserSettings(userId, settings) {
        const providers = [
            {
                provider: 'TELEGRAM',
                enabled: settings.provider.enabled,
                data: settings.provider.chatId
                    ? { chatId: settings.provider.chatId }
                    : {},
            },
        ];
        await userRepository_1.default.updateUserSettings(userId, settings.notifications, providers);
    }
    extractChatId(providerData) {
        if (providerData &&
            typeof providerData === 'object' &&
            'chatId' in providerData) {
            const chatId = providerData.chatId;
            return chatId ? String(chatId) : null;
        }
        return null;
    }
}
exports.default = new UserSettingsService();
