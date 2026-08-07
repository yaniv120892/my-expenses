import categoryService from '../services/categoryService';
import { Category } from '../types/category';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorUtils';

export class CategoryController {
  public async list(): Promise<Category[]> {
    try {
      logger.debug('Start get all categories');
      const categories = await categoryService.list();
      logger.debug('Done get all categories', categories);
      return categories;
    } catch (error) {
      logger.error(`Failed to get all categories, ${getErrorMessage(error)}`);
      throw error;
    }
  }

  public async byId(id: string): Promise<Category | null> {
    try {
      logger.debug('Start get category by id', id);
      const category = await categoryService.byId(id);
      logger.debug('Done get category by id', category);
      return category;
    } catch (error) {
      logger.error(`Failed to get category by id, ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

export default new CategoryController();
