"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const redisProvider_1 = require("../common/redisProvider");
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
const emailService_1 = __importDefault(require("./emailService"));
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
const SESSION_TTL = 7 * 24 * 60 * 60;
class AuthService {
    async signupUser(email, username, password) {
        const existingUser = await userRepository_1.default.findByEmailOrUsername(email, username);
        if (existingUser) {
            return { error: 'User already exists' };
        }
        const hashedPassword = await (0, bcryptjs_1.hash)(password, 10);
        await userRepository_1.default.createUser(email, username, hashedPassword);
        const code = this.generateCode();
        await (0, redisProvider_1.setValue)(`loginCode:${email}`, code, 600);
        await this.sendCodeByEmail(email, code);
        return {
            message: 'Verification code sent to email. Code is valid for 10 minutes.',
        };
    }
    async loginUser(email, username, password) {
        const user = await userRepository_1.default.findByEmailOrUsername(email, username);
        if (!user) {
            return { error: 'Invalid credentials' };
        }
        const valid = await (0, bcryptjs_1.compare)(password, user.password);
        if (!valid) {
            return { error: 'Invalid credentials' };
        }
        if (user.verified === false) {
            return { error: 'User not verified' };
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, {
            expiresIn: '7d',
        });
        const decoded = jsonwebtoken_1.default.decode(token);
        let ttl = SESSION_TTL;
        if (decoded && typeof decoded === 'object' && decoded.exp) {
            ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
        }
        await this.storeSession(user.id, token, ttl);
        return { token };
    }
    async verifyLoginCode(email, code) {
        const cachedCode = await (0, redisProvider_1.getValue)(`loginCode:${email}`);
        if (!cachedCode || cachedCode !== code) {
            return { error: 'Invalid or expired code' };
        }
        const user = await userRepository_1.default.findByEmail(email);
        if (!user) {
            return { error: 'User not found' };
        }
        await userRepository_1.default.verifyUser(email);
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
        const decoded = jsonwebtoken_1.default.decode(token);
        let ttl = SESSION_TTL;
        if (decoded && typeof decoded === 'object' && decoded.exp) {
            ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
        }
        await (0, redisProvider_1.deleteValue)(`loginCode:${email}`);
        await this.storeSession(user.id, token, ttl);
        return { token };
    }
    async logoutUser(userId, token) {
        await this.invalidateSession(userId, token);
    }
    async invalidateSession(userId, token) {
        const sessionKey = `session:${userId}:${token}`;
        await (0, redisProvider_1.deleteValue)(sessionKey);
    }
    async validateSession(userId, token) {
        const sessionKey = `session:${userId}:${token}`;
        const exists = await (0, redisProvider_1.getValue)(sessionKey);
        if (!exists) {
            return false;
        }
        try {
            jsonwebtoken_1.default.verify(token, jwtSecret);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    generateCode() {
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    generateVerificationEmailText(code, email) {
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
    generateVerificationEmailHtml(code, email) {
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
    async sendCodeByEmail(email, code) {
        const subject = 'Your Verification Code';
        const text = this.generateVerificationEmailText(code, email);
        const html = this.generateVerificationEmailHtml(code, email);
        await emailService_1.default.send({
            to: email,
            subject,
            text,
            html,
        });
    }
    async storeSession(userId, token, ttl) {
        const sessionKey = `session:${userId}:${token}`;
        await (0, redisProvider_1.setValue)(sessionKey, '1', ttl);
    }
}
exports.default = new AuthService();
