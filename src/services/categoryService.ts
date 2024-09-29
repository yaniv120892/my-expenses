import categoryRepository from '@src/repositories/categoryRepository';
import { Category } from '@src/types/category';

export class CategoryService {
  public async getAllCategories(): Promise<Category[]> {
    return await categoryRepository.getAllCategories();
  }
}

export default new CategoryService();
