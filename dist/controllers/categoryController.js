"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const categoryService_1 = __importDefault(require("../services/categoryService"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorUtils_1 = require("../utils/errorUtils");
class CategoryController {
    async list() {
        try {
            logger_1.default.debug('Start get all categories');
            const categories = await categoryService_1.default.list();
            logger_1.default.debug('Done get all categories', categories);
            return categories;
        }
        catch (error) {
            logger_1.default.error(`Failed to get all categories, ${(0, errorUtils_1.getErrorMessage)(error)}`);
            throw error;
        }
    }
    async byId(id) {
        try {
            logger_1.default.debug('Start get category by id', id);
            const category = await categoryService_1.default.byId(id);
            logger_1.default.debug('Done get category by id', category);
            return category;
        }
        catch (error) {
            logger_1.default.error(`Failed to get category by id, ${(0, errorUtils_1.getErrorMessage)(error)}`);
            throw error;
        }
    }
}
exports.CategoryController = CategoryController;
exports.default = new CategoryController();
