"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_transport_1 = __importDefault(require("winston-transport"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const logtailToken = process.env.LOGTAIL_TOKEN || '';
const logtailHost = process.env.LOGTAIL_HOST || '';
const logtailEndpoint = `https://${logtailHost}`;
async function logToLogtail(message, level = 'info', meta = {}) {
    if (!logtailToken || !logtailHost) {
        return;
    }
    try {
        await (0, node_fetch_1.default)(logtailEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${logtailToken}`,
            },
            body: JSON.stringify(Object.assign({ dt: new Date().toISOString(), level,
                message }, meta)),
        });
    }
    catch (err) {
        console.error('Error logging to Logtail:', err);
    }
}
const logFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, meta = __rest(_a, ["level", "message", "timestamp"]);
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
});
class LogtailHttpTransport extends winston_transport_1.default {
    log(info, callback) {
        setImmediate(() => {
            logToLogtail(info.message, info.level, info);
            callback();
        });
    }
}
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), logFormat),
    transports: [
        new winston_1.default.transports.Console(), // Log to console
        new LogtailHttpTransport(), // Log to Logtail via HTTP
    ],
});
const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
};
exports.requestLogger = requestLogger;
exports.default = logger;
