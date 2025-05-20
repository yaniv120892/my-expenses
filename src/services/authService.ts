import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import userRepository from '../repositories/userRepository';
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
    const code = this.generateCode();
    loginCodeCache.set(email, code);
    await this.sendCodeByEmail(email, code);
    return {
      message: 'Verification code sent to email. Code is valid for 10 minutes.',
    };
  }

  async loginUser(email: string, username: string, password: string) {
    const user = await userRepository.findByEmailOrUsername(email, username);
    if (!user) {
      return {
        error: 'Invalid credentials',
      };
    }
    const valid = await compare(password, user.password);
    if (!valid) {
      return { error: 'Invalid credentials' };
    }
    if (user.verified === false) {
      return { error: 'User not verified' };
    }
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    return { token };
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

  generateVerificationEmailText(code: string, email: string) {
    const websiteUrl = process.env.WEBSITE_URL;
    return [
      'Hello,',
      '',
      'Thank you for signing up. To complete your registration, please use the verification code below:',
      '',
      `Verification Code: ${code}`,
      '',
      'You can copy the code above and paste it into the verification page.',
      '',
      `This code will expire in 10 minutes. For your security, do not share this code with anyone.`,
      '',
      `If you did not request this code, you can safely ignore this email.`,
      '',
      `To verify your email address, visit: ${websiteUrl}/verify?email=${email}`,
      '',
      'Best regards,',
      'The My Expenses Team',
    ].join('\n');
  }

  generateVerificationEmailHtml(code: string, email: string) {
    const websiteUrl = process.env.WEBSITE_URL;
    return `
      <div style="font-family: Arial, sans-serif; color: #222; max-width: 480px; margin: 0 auto;">
        <p>Hello,</p>
        <p>Thank you for signing up. To complete your registration, please use the verification code below:</p>
        <div style="margin: 24px 0;">
          <span style="display: inline-block; font-size: 1.5em; letter-spacing: 0.2em; background: #f4f4f4; padding: 16px 32px; border-radius: 8px; font-weight: bold; user-select: all;">${code}</span>
        </div>
        <p>You can copy the code above and paste it into the verification page.</p>
        <p>This code will expire in 10 minutes. For your security, do not share this code with anyone.</p>
        <p>If you did not request this code, you can safely ignore this email.</p>
        <p>To verify your email address, visit: <a href="${websiteUrl}/verify?email=${email}">${websiteUrl}/verify?email=${email}</a></p>
        <p style="margin-top: 32px;">Best regards,<br>The My Expenses Team</p>
      </div>
    `;
  }

  async sendCodeByEmail(email: string, code: string) {
    const subject = 'Your Verification Code';
    const text = this.generateVerificationEmailText(code, email);
    const html = this.generateVerificationEmailHtml(code, email);
    await emailService.send({
      to: email,
      subject,
      text,
      html,
    });
  }
}

export default new AuthService();
