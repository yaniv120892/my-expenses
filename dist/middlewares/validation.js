"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const logger_1 = __importDefault(require("../utils/logger"));
const validateRequest = (type, isQuery = false) => {
    return async (req, res, next) => {
        const requestObj = (0, class_transformer_1.plainToInstance)(type, isQuery ? req.query : req.body);
        const errors = await (0, class_validator_1.validate)(requestObj);
        if (errors.length > 0) {
            const extractedErrors = errors
                .map((err) => Object.values(err.constraints || {}))
                .flat();
            logger_1.default.warn(`Validation failed: ${extractedErrors.join(', ')}`);
            res.status(400).json({
                message: 'Validation failed',
                errors: extractedErrors,
            });
            return;
        }
        if (isQuery) {
            req.query = requestObj;
        }
        else {
            req.body = requestObj;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
