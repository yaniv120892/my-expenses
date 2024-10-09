import categoryRepository from '..//repositories/categoryRepository';
import { Category } from '..//types/category';

export class CategoryService {
  public async getAllCategories(): Promise<Category[]> {
    return await categoryRepository.getAllCategories();
  }
}

export default new CategoryService();
