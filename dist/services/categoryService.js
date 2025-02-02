"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const categoryRepository_1 = __importDefault(require("..//repositories/categoryRepository"));
class CategoryService {
    async list() {
        return await categoryRepository_1.default.getAllCategories();
    }
    async byId(id) {
        return await categoryRepository_1.default.getCategoryById(id);
    }
}
exports.CategoryService = CategoryService;
exports.default = new CategoryService();
