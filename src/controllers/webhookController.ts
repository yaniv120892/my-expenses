import { WebhookRequest } from 'controllers/requests';
import { commandHandler } from '../commandHandlers/commandHandler';
import { telegramService } from '../services/telegramService';

class WebhookController {
  async handleWebhook(req: WebhookRequest) {
    const chatId = req.message.chat.id;
    const text = req.message.text?.trim();

    if (!text) {
      return telegramService.sendMessage(
        chatId.toString(),
        'Please enter a valid command.',
      );
    }

    const [command, ...args] = text.split(' ');

    try {
      await commandHandler.executeCommand(command, chatId.toString(), args);
    } catch (error) {
      console.error('Webhook Error:', error);
      return telegramService.sendMessage(
        chatId.toString(),
        '❌ An error occurred.',
      );
    }
  }
}

export const webhookController = new WebhookController();
