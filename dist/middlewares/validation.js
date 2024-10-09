"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const validateRequest = (type, isQuery = false) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Use req.query if isQuery is true, otherwise use req.body
        const requestObj = (0, class_transformer_1.plainToInstance)(type, isQuery ? req.query : req.body);
        const errors = yield (0, class_validator_1.validate)(requestObj);
        if (errors.length > 0) {
            const extractedErrors = errors
                .map((err) => Object.values(err.constraints || {}))
                .flat();
            // Send response directly, but don't return it
            res.status(400).json({
                message: 'Validation failed',
                errors: extractedErrors,
            });
            return; // Prevent further execution
        }
        // Assign validated object back to the request
        if (isQuery) {
            // Cast the validated object to match ParsedQs
            req.query = requestObj; // For query parameters
        }
        else {
            req.body = requestObj; // For request body
        }
        next(); // Proceed to the next middleware/controller
    });
};
exports.validateRequest = validateRequest;
