import { PrismaClient } from '@prisma/client';
import { Category } from '..//types/category';
import NodeCache from 'node-cache';

const prisma = new PrismaClient();
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

async function getAllCategoriesWithCache(prisma: PrismaClient) {
  const cacheKey = getCacheKeyForAllCategories();
  const cached = categoryCache.get(cacheKey);
  if (cached) return cached as Category[];
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  categoryCache.set(cacheKey, categories);
  return categories;
}

async function getCategoryByIdWithCache(
  prisma: PrismaClient,
  id: string | null,
) {
  const cacheKey = getCacheKeyForCategoryById(id);
  const cached = categoryCache.get(cacheKey);
  if (cached) return cached as Category | null;
  if (!id) return null;
  const category = await prisma.category.findUnique({ where: { id } });
  categoryCache.set(cacheKey, category);
  return category;
}

export class CategoryRepository {
  public async getAllCategories(): Promise<Category[]> {
    return await getAllCategoriesWithCache(prisma);
  }

  public async getCategoryById(id: string | null): Promise<Category | null> {
    return await getCategoryByIdWithCache(prisma, id);
  }
}

export default new CategoryRepository();
