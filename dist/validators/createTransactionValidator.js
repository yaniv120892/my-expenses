"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
const validationError_1 = require("../errors/validationError");
class CreateTransactionValidator {
    async validate(data) {
        const category = await categoryRepository_1.default.getCategoryById(data.categoryId);
        if (!category) {
            throw new validationError_1.CustomValidationError(`Category with id ${data.categoryId} not found`);
        }
    }
}
exports.default = new CreateTransactionValidator();
