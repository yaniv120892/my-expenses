import TelegramBot from 'node-telegram-bot-api';

export const handleResponse = async (
  chatId: number,
  response: { message: string },
  bot: TelegramBot,
) => {
  // Send the message to the user via Telegram
  await bot.sendMessage(chatId, response.message);
};
