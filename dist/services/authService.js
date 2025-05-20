"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const node_cache_1 = __importDefault(require("node-cache"));
const userRepository_1 = __importDefault(require("repositories/userRepository"));
const emailService_1 = __importDefault(require("./emailService"));
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
const loginCodeCache = new node_cache_1.default({ stdTTL: 600 });
class AuthService {
    async signupUser(email, username, password) {
        const existingUser = await userRepository_1.default.findByEmailOrUsername(email, username);
        if (existingUser) {
            return { error: 'User already exists' };
        }
        const hashedPassword = await (0, bcryptjs_1.hash)(password, 10);
        await userRepository_1.default.createUser(email, username, hashedPassword);
        return { success: true };
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
        const code = this.generateCode();
        loginCodeCache.set(user.email, code);
        await this.sendCodeByEmail(user.email, code);
        return {
            success: true,
            message: 'Verification code sent to email. Code is valid for 10 minutes.',
        };
    }
    async verifyLoginCode(email, code) {
        const cachedCode = loginCodeCache.get(email);
        if (!cachedCode || cachedCode !== code) {
            return { error: 'Invalid or expired code' };
        }
        const user = await userRepository_1.default.findByEmail(email);
        if (!user) {
            return { error: 'User not found' };
        }
        await userRepository_1.default.verifyUser(email);
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
        loginCodeCache.del(email);
        return { token };
    }
    generateCode() {
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    async sendCodeByEmail(email, code) {
        await emailService_1.default.send({
            to: email,
            subject: 'Your Verification Code',
            text: `Your verification code is ${code}. It is valid for 10 minutes.`,
        });
    }
}
exports.default = new AuthService();
