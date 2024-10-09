import categoryRepository from '@app/repositories/categoryRepository';
import { Category } from '@app/types/category';

export class CategoryService {
  public async getAllCategories(): Promise<Category[]> {
    return await categoryRepository.getAllCategories();
  }
}

export default new CategoryService();
