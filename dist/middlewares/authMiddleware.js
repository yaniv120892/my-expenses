"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const authService_1 = __importDefault(require("../services/authService"));
const jwtSecret = process.env.JWT_SECRET || 'defaultSecret';
const authenticateRequest = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_HEADER_MISSING',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            error: 'Invalid token format',
            code: 'INVALID_TOKEN_FORMAT',
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const isValidSession = await authService_1.default.validateSession(decoded.userId, token);
        if (!isValidSession) {
            res.status(401).json({
                error: 'Session expired',
                code: 'SESSION_EXPIRED',
            });
            return;
        }
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN',
            });
            return;
        }
        logger_1.default.error('Authentication error', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
        });
        return;
    }
};
exports.authenticateRequest = authenticateRequest;
