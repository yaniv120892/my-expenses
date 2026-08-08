"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
// `_next` is unused but must stay: Express only treats a handler as error
// middleware when it declares four parameters.
const errorHandler = (err, req, res, _next) => {
    const error = (err !== null && err !== void 0 ? err : {});
    if (error.name === 'CustomValidationError') {
        logger_1.default.warn(error.message);
        res.status(400).json({ message: error.message });
        return;
    }
    logger_1.default.error(error.message || 'Internal Server Error');
    const statusCode = error.status || 500;
    res.status(statusCode).json(Object.assign({ message: error.message || 'Internal Server Error' }, (process.env.NODE_ENV === 'development' && { stack: error.stack })));
};
exports.errorHandler = errorHandler;
