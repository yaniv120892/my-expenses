import TelegramBot from 'node-telegram-bot-api';

class TelegramService {
  private bot: TelegramBot;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
    this.bot = new TelegramBot(token);
  }

  async sendMessage(chatId: string, message: string) {
    return this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async editMessage(chatId: string, messageId: number, newText: string) {
    return this.bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
    });
  }
}

export const telegramService = new TelegramService();
