import express, { Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';
import { handleResponse } from '../utils/handleTelegramResponse';
import TelegramBot from 'node-telegram-bot-api';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const chatId = req.body.message.chat.id;
  const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
  const bot = new TelegramBot(token); // Initialize the bot instance

  try {
    const response = await webhookController.handleWebhook(req.body);

    // Send the response message and handle next step
    await handleResponse(chatId, response, bot);

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Error occurred' });
  }
});

export default router;
