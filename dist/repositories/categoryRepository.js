"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const client_1 = __importDefault(require("../prisma/client"));
const oneDayInSeconds = 24 * 60 * 60;
const categoryCache = new node_cache_1.default({
    stdTTL: oneDayInSeconds,
    checkperiod: 120,
});
function getCacheKeyForAllCategories() {
    return 'allCategories';
}
function getCacheKeyForCategoryById(id) {
    return `categoryById:${id}`;
}
class CategoryRepository {
    async getAllCategories() {
        const cacheKey = getCacheKeyForAllCategories();
        const cached = categoryCache.get(cacheKey);
        if (cached)
            return cached;
        const categories = await client_1.default.category.findMany({
            select: { id: true, name: true },
        });
        categoryCache.set(cacheKey, categories);
        return categories;
    }
    async getCategoryById(id) {
        const cacheKey = getCacheKeyForCategoryById(id);
        const cached = categoryCache.get(cacheKey);
        if (cached)
            return cached;
        if (!id)
            return null;
        const category = await client_1.default.category.findUnique({ where: { id } });
        categoryCache.set(cacheKey, category);
        return category;
    }
}
exports.CategoryRepository = CategoryRepository;
exports.default = new CategoryRepository();
