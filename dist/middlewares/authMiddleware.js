"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("express");
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
const logger_1 = __importDefault(require("../utils/logger"));
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
const authenticateRequest = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        catch (_a) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const userId = typeof payload === 'object' && 'userId' in payload
            ? payload.userId
            : undefined;
        if (!userId) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        const user = await userRepository_1.default.findById(userId);
        if (!user || !user.verified) {
            res.status(401).json({ error: 'User not verified' });
            return;
        }
        req.userId = user.id;
        next();
    }
    catch (error) {
        logger_1.default.error('Failed to authenticate request', error, req.headers);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticateRequest = authenticateRequest;
