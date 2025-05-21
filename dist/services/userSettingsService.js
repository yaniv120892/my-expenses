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
        return userRepository_1.default.getUserSettings(userId);
    }
    async updateUserSettings(userId, settings) {
        await userRepository_1.default.updateUserSettings(userId, settings.notifications);
    }
}
exports.default = new UserSettingsService();
