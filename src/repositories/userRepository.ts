import { User } from '@prisma/client';
import prisma from '../prisma/client';

class UserRepository {
  async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
  }

  async createUser(
    email: string,
    username: string,
    hashedPassword: string,
  ): Promise<User> {
    return prisma.user.create({
      data: { email, username, password: hashedPassword, verified: false },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async verifyUser(email: string): Promise<User> {
    return prisma.user.update({
      where: { email },
      data: { verified: true },
    });
  }
}

export default new UserRepository();
