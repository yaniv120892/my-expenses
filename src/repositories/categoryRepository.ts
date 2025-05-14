import { Category } from '..//types/category';
import NodeCache from 'node-cache';
import prisma from '../prisma/client';

const oneDayInSeconds = 24 * 60 * 60;
const categoryCache = new NodeCache({
  stdTTL: oneDayInSeconds,
  checkperiod: 120,
});

function getCacheKeyForAllCategories() {
  return 'allCategories';
}

function getCacheKeyForCategoryById(id: string | null) {
  return `categoryById:${id}`;
}

export class CategoryRepository {
  public async getAllCategories(): Promise<Category[]> {
    const cacheKey = getCacheKeyForAllCategories();
    const cached = categoryCache.get(cacheKey);
    if (cached) return cached as Category[];
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    categoryCache.set(cacheKey, categories);
    return categories;
  }

  public async getCategoryById(id: string | null): Promise<Category | null> {
    const cacheKey = getCacheKeyForCategoryById(id);
    const cached = categoryCache.get(cacheKey);
    if (cached) return cached as Category | null;
    if (!id) return null;
    const category = await prisma.category.findUnique({ where: { id } });
    categoryCache.set(cacheKey, category);
    return category;
  }
}

export default new CategoryRepository();
