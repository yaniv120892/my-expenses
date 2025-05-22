import TelegramBot from 'node-telegram-bot-api';

export const handleResponse = async (
  chatId: string,
  response: { message: string },
  bot: TelegramBot,
) => {
  await bot.sendMessage(chatId, response.message);
};
