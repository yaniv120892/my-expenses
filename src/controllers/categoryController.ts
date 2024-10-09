import categoryService from '@app/services/categoryService';
import { Category } from '@app/types/category';
import logger from '@app/utils/logger';

export class CategoryController {
  async getAllCategories(): Promise<Category[]> {
    try {
      logger.debug('Start get all categories');
      const categories = await categoryService.getAllCategories();
      logger.debug('Done get all categories', categories);
      return categories;
    } catch (error: any) {
      logger.error(`Failed to get all categories, ${error.message}`);
      throw error;
    }
  }
}

export default new CategoryController();
