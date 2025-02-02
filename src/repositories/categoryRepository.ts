import { PrismaClient } from '@prisma/client';
import { Category } from '..//types/category';

const prisma = new PrismaClient();

export class CategoryRepository {
  public async getAllCategories(): Promise<Category[]> {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async getCategoryById(id: string | null): Promise<Category | null> {
    if (!id) {
      return null;
    }

    return await prisma.category.findUnique({
      where: { id },
    });
  }
}

export default new CategoryRepository();
