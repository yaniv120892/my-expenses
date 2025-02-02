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
// Define the log format
const logFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, meta = __rest(_a, ["level", "message", "timestamp"]);
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
});
// Create the logger instance
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info', // Set default log level
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), logFormat),
    transports: [
        new winston_1.default.transports.Console(), // Log to console
    ],
});
const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
};
exports.requestLogger = requestLogger;
// Export the logger instance
exports.default = logger;
