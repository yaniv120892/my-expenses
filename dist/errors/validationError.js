"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomValidationError = void 0;
class CustomValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CustomValidationError';
    }
}
exports.CustomValidationError = CustomValidationError;
