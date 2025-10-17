"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebhookToken = generateWebhookToken;
exports.verifyWebhookToken = verifyWebhookToken;
exports.extractWebhookParams = extractWebhookParams;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("./logger"));
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
function getWebhookSecret() {
    const secret = process.env.EXCEL_EXTRACTION_AGENT_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('EXCEL_EXTRACTION_AGENT_WEBHOOK_SECRET environment variable is required');
    }
    return secret;
}
/**
 * Generate HMAC-based webhook authentication token
 * @param userId - User ID making the request
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Base64-encoded HMAC token
 */
function generateWebhookToken(userId, timestamp) {
    const secret = getWebhookSecret();
    const payload = `${userId}:${timestamp}`;
    const hmac = crypto_1.default.createHmac('sha256', secret);
    hmac.update(payload);
    const token = hmac.digest('base64url');
    logger_1.default.debug('Generated webhook token', {
        userId,
        timestamp,
    });
    return token;
}
/**
 * Verify HMAC-based webhook authentication token
 * @param token - Token to verify
 * @param userId - User ID from the request
 * @param timestamp - Timestamp from the request
 * @returns true if token is valid and not expired
 */
function verifyWebhookToken(token, userId, timestamp) {
    const secret = getWebhookSecret();
    if (!token || !userId || !timestamp) {
        logger_1.default.warn('Missing required parameters for token verification', {
            hasToken: !!token,
            hasUserId: !!userId,
            hasTimestamp: !!timestamp,
        });
        return false;
    }
    // Check token expiry
    const now = Date.now();
    const age = now - timestamp;
    if (age > TOKEN_EXPIRY_MS) {
        logger_1.default.warn('Webhook token expired', {
            userId,
            timestamp,
            age,
            maxAge: TOKEN_EXPIRY_MS,
        });
        return false;
    }
    if (age < 0) {
        logger_1.default.warn('Webhook token timestamp is in the future', {
            userId,
            timestamp,
            now,
        });
        return false;
    }
    // Generate expected token and compare
    try {
        const expectedToken = generateWebhookToken(userId, timestamp);
        const isValid = crypto_1.default.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
        if (!isValid) {
            logger_1.default.warn('Webhook token verification failed', {
                userId,
                timestamp,
                tokenPreview: token.substring(0, 10) + '...',
            });
        }
        return isValid;
    }
    catch (error) {
        logger_1.default.error('Error verifying webhook token', {
            error,
            userId,
            timestamp,
        });
        return false;
    }
}
/**
 * Extract token, userId, and timestamp from webhook URL query parameters
 * @param query - Express request query object
 * @returns Extracted parameters or null if invalid
 */
function extractWebhookParams(query) {
    const { token, userId, timestamp } = query;
    if (!token || !userId || !timestamp) {
        logger_1.default.warn('Missing webhook query parameters', {
            hasToken: !!token,
            hasUserId: !!userId,
            hasTimestamp: !!timestamp,
        });
        return null;
    }
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
        logger_1.default.warn('Invalid timestamp in webhook query', { timestamp });
        return null;
    }
    return {
        token: String(token),
        userId: String(userId),
        timestamp: timestampNum,
    };
}
