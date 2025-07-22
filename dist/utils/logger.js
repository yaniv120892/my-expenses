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
const node_1 = require("@logtail/node");
const winston_transport_1 = __importDefault(require("winston-transport"));
const logtailToken = process.env.LOGTAIL_TOKEN;
console.log('logtailToken', logtailToken);
const logtail = new node_1.Logtail(logtailToken !== null && logtailToken !== void 0 ? logtailToken : '');
// Custom Winston transport for Logtail using winston-transport
class LogtailTransport extends winston_transport_1.default {
    log(info, callback) {
        setImmediate(() => this.emit('logged', info));
        if (logtail) {
            logtail.log(info).catch(() => {
                console.error('Error logging to Logtail', info);
            }); // Ignore errors
        }
        callback();
    }
}
const logFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, meta = __rest(_a, ["level", "message", "timestamp"]);
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
});
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), logFormat),
    transports: [
        new winston_1.default.transports.Console(), // Log to console
        ...(logtail ? [new LogtailTransport()] : []), // Log to Logtail if token exists
    ],
});
const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
};
exports.requestLogger = requestLogger;
exports.default = logger;
