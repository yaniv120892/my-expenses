import TelegramBot from 'node-telegram-bot-api';

export const handleResponse = async (
  chatId: number,
  response: { message: string },
  bot: TelegramBot,
) => {
  await bot.sendMessage(chatId, response.message);
};
