"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    if (err.name === 'CustomValidationError') {
        logger_1.default.warn(err.message);
        res.status(400).json({ message: err.message });
        return;
    }
    logger_1.default.error(err.message || 'Internal Server Error');
    const statusCode = err.status || 500;
    res.status(statusCode).json(Object.assign({ message: err.message || 'Internal Server Error' }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
