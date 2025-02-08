"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryHandler = void 0;
const categoryService_1 = __importDefault(require("../services/categoryService"));
const telegramService_1 = require("../services/telegramService");
class CategoryHandler {
    async handleList(chatId) {
        const categories = await categoryService_1.default.list();
        if (!categories.length) {
            return telegramService_1.telegramService.sendMessage(chatId, 'No categories found.');
        }
        const categoryList = categories
            .map((category) => `📌 *${category.name}* (ID: \`${category.id}\`)`)
            .join('\n');
        return telegramService_1.telegramService.sendMessage(chatId, `📂 *Available Categories:*\n\n${categoryList}`);
    }
}
exports.categoryHandler = new CategoryHandler();
