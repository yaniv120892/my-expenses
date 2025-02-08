import categoryService from '../services/categoryService';
import { telegramService } from '../services/telegramService';

class CategoryHandler {
  async handleList(chatId: number) {
    const categories = await categoryService.list();

    if (!categories.length) {
      return telegramService.sendMessage(chatId, 'No categories found.');
    }

    const categoryList = categories
      .map((category) => `📌 *${category.name}* (ID: \`${category.id}\`)`)
      .join('\n');

    return telegramService.sendMessage(
      chatId,
      `📂 *Available Categories:*\n\n${categoryList}`,
    );
  }
}

export const categoryHandler = new CategoryHandler();
