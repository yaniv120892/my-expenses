import { User } from '@prisma/client';
import prisma from '../prisma/client';
import { UserQuery } from './types';

class UserRepository {
  public async getUsersRequiredDailySummary() {
    const userNotificationPreferences =
      await prisma.userNotificationPreference.findMany({
        where: {
          dailySummary: true,
        },
        select: {
          userId: true,
        },
      });
    return userNotificationPreferences.map((user) => user.userId);
  }

  public async isCreateTransactionNotificationEnabled(userId: string) {
    const notificationPreference =
      await prisma.userNotificationPreference.findUnique({
        where: { userId },
        select: { createTransaction: true },
      });

    return notificationPreference?.createTransaction ?? false;
  }

  public async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  public async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
  }

  public async createUser(
    email: string,
    username: string,
    hashedPassword: string,
  ): Promise<User> {
    return prisma.user.create({
      data: { email, username, password: hashedPassword, verified: false },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  public async verifyUser(email: string): Promise<User> {
    return prisma.user.update({
      where: { email },
      data: { verified: true },
    });
  }

  public async getUserSettings(userId: string) {
    const user = await prisma.user.findUnique({
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
        createTransaction: user.userNotifications?.createTransaction ?? false,
        dailySummary: user.userNotifications?.dailySummary ?? false,
      },
    };
  }

  public async updateUserSettings(
    userId: string,
    notifications: { createTransaction: boolean; dailySummary: boolean },
  ) {
    await prisma.userNotificationPreference.upsert({
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

  public async list(query: UserQuery) {
    const users = await prisma.user.findMany({
      where: {
        verified: query.isVerified ? true : undefined,
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      verified: user.verified,
    }));
  }
}

export default new UserRepository();
