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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const categoryService_1 = __importDefault(require("../services/categoryService"));
const logger_1 = __importDefault(require("../utils/logger"));
class CategoryController {
    getAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug('Start get all categories');
                const categories = yield categoryService_1.default.getAllCategories();
                logger_1.default.debug('Done get all categories', categories);
                return categories;
            }
            catch (error) {
                logger_1.default.error(`Failed to get all categories, ${error.message}`);
                throw error;
            }
        });
    }
}
exports.CategoryController = CategoryController;
exports.default = new CategoryController();
