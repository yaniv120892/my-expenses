import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import userRepository from 'repositories/userRepository';
import emailService from './emailService';

const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
const loginCodeCache = new NodeCache({ stdTTL: 600 });

class AuthService {
  async signupUser(email: string, username: string, password: string) {
    const existingUser = await userRepository.findByEmailOrUsername(
      email,
      username,
    );
    if (existingUser) {
      return { error: 'User already exists' };
    }
    const hashedPassword = await hash(password, 10);
    await userRepository.createUser(email, username, hashedPassword);
    return { success: true };
  }

  async loginUser(email: string, username: string, password: string) {
    const user = await userRepository.findByEmailOrUsername(email, username);
    if (!user) {
      return { error: 'Invalid credentials' };
    }
    const valid = await compare(password, user.password);
    if (!valid) {
      return { error: 'Invalid credentials' };
    }
    const code = this.generateCode();
    loginCodeCache.set(user.email, code);
    await this.sendCodeByEmail(user.email, code);
    return {
      success: true,
      message: 'Verification code sent to email. Code is valid for 10 minutes.',
    };
  }

  async verifyLoginCode(email: string, code: string) {
    const cachedCode = loginCodeCache.get(email);
    if (!cachedCode || cachedCode !== code) {
      return { error: 'Invalid or expired code' };
    }
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { error: 'User not found' };
    }
    await userRepository.verifyUser(email);
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    loginCodeCache.del(email);
    return { token };
  }

  generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendCodeByEmail(email: string, code: string) {
    await emailService.send({
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is ${code}. It is valid for 10 minutes.`,
    });
  }
}

export default new AuthService();
