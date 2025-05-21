"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class UserRepository {
    async getUsersRequiredDailySummary() {
        const userNotificationPreferences = await client_1.default.userNotificationPreference.findMany({
            where: {
                dailySummary: true,
            },
            select: {
                userId: true,
            },
        });
        return userNotificationPreferences.map((user) => user.userId);
    }
    async isCreateTransactionNotificationEnabled(userId) {
        var _a;
        const notificationPreference = await client_1.default.userNotificationPreference.findUnique({
            where: { userId },
            select: { createTransaction: true },
        });
        return (_a = notificationPreference === null || notificationPreference === void 0 ? void 0 : notificationPreference.createTransaction) !== null && _a !== void 0 ? _a : false;
    }
    async findById(userId) {
        return client_1.default.user.findUnique({ where: { id: userId } });
    }
    async findByEmailOrUsername(email, username) {
        return client_1.default.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
    }
    async createUser(email, username, hashedPassword) {
        return client_1.default.user.create({
            data: { email, username, password: hashedPassword, verified: false },
        });
    }
    async findByEmail(email) {
        return client_1.default.user.findUnique({ where: { email } });
    }
    async verifyUser(email) {
        return client_1.default.user.update({
            where: { email },
            data: { verified: true },
        });
    }
    async getUserSettings(userId) {
        var _a, _b, _c, _d;
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                userNotifications: true,
            },
        });
        if (!user) {
            return null;
        }
        return {
            info: { email: user.email },
            notifications: {
                createTransaction: (_b = (_a = user.userNotifications) === null || _a === void 0 ? void 0 : _a.createTransaction) !== null && _b !== void 0 ? _b : false,
                dailySummary: (_d = (_c = user.userNotifications) === null || _c === void 0 ? void 0 : _c.dailySummary) !== null && _d !== void 0 ? _d : false,
            },
        };
    }
    async updateUserSettings(userId, notifications) {
        await client_1.default.userNotificationPreference.upsert({
            where: { userId: userId },
            update: {
                createTransaction: notifications.createTransaction,
                dailySummary: notifications.dailySummary,
            },
            create: {
                userId: userId,
                createTransaction: notifications.createTransaction,
                dailySummary: notifications.dailySummary,
            },
        });
    }
}
exports.default = new UserRepository();
