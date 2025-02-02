"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResponse = void 0;
const handleResponse = async (chatId, response, bot) => {
    // Send the message to the user via Telegram
    await bot.sendMessage(chatId, response.message);
};
exports.handleResponse = handleResponse;
