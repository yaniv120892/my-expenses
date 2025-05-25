"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const redisProvider_1 = require("../common/redisProvider");
const oneDayInSeconds = 24 * 60 * 60;
function getCacheKeyForAllCategories() {
    return 'allCategories';
}
function getCacheKeyForCategoryById(id) {
    return `category:${id}`;
}
function getCacheKeyForTopLevelCategories() {
    return 'topLevelCategories';
}
class CategoryRepository {
    async getAllCategories() {
        const cacheKey = getCacheKeyForAllCategories();
        const cached = await (0, redisProvider_1.getValue)(cacheKey);
        if (cached) {
            return cached;
        }
        const categories = await client_1.default.category.findMany({
            select: { id: true, name: true, parentId: true },
        });
        await (0, redisProvider_1.setValue)(cacheKey, JSON.stringify(categories), oneDayInSeconds);
        return categories;
    }
    async getCategoryById(id) {
        const cacheKey = getCacheKeyForCategoryById(id);
        const cached = await (0, redisProvider_1.getValue)(cacheKey);
        if (cached) {
            return cached;
        }
        if (!id)
            return null;
        const category = await client_1.default.category.findUnique({ where: { id } });
        await (0, redisProvider_1.setValue)(cacheKey, JSON.stringify(category), oneDayInSeconds);
        return category;
    }
    async getTopLevelCategories() {
        const cacheKey = getCacheKeyForTopLevelCategories();
        const cached = await (0, redisProvider_1.getValue)(cacheKey);
        if (cached) {
            return cached;
        }
        const categories = await client_1.default.category.findMany({
            where: { parentId: null },
            select: { id: true, name: true },
        });
        await (0, redisProvider_1.setValue)(cacheKey, JSON.stringify(categories), oneDayInSeconds);
        return categories;
    }
}
exports.CategoryRepository = CategoryRepository;
exports.default = new CategoryRepository();
