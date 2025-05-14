"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const client_1 = require("@prisma/client");
const node_cache_1 = __importDefault(require("node-cache"));
const prisma = new client_1.PrismaClient();
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
async function getAllCategoriesWithCache(prisma) {
    const cacheKey = getCacheKeyForAllCategories();
    const cached = categoryCache.get(cacheKey);
    if (cached)
        return cached;
    const categories = await prisma.category.findMany({
        select: { id: true, name: true },
    });
    categoryCache.set(cacheKey, categories);
    return categories;
}
async function getCategoryByIdWithCache(prisma, id) {
    const cacheKey = getCacheKeyForCategoryById(id);
    const cached = categoryCache.get(cacheKey);
    if (cached)
        return cached;
    if (!id)
        return null;
    const category = await prisma.category.findUnique({ where: { id } });
    categoryCache.set(cacheKey, category);
    return category;
}
class CategoryRepository {
    async getAllCategories() {
        return await getAllCategoriesWithCache(prisma);
    }
    async getCategoryById(id) {
        return await getCategoryByIdWithCache(prisma, id);
    }
}
exports.CategoryRepository = CategoryRepository;
exports.default = new CategoryRepository();
