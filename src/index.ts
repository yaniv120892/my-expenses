import * as dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import express from 'express';
import router from './routers/index';
import logger, { requestLogger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const PORT = process.env.PORT || 3000;
const apiURL = process.env.API_URL || `http://localhost:${PORT}`;

const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
const bot = new TelegramBot(token);

app.use(express.json());
app.use(requestLogger);

app.use('/', router);

// Set webhook for Telegram bot (optional)
const setWebhook = async () => {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';

  logger.info(`Setting Telegram webhook to: ${webhookUrl}`);
  try {
    await bot.setWebHook(webhookUrl);
    logger.info('Telegram webhook set successfully');
  } catch (err) {
    logger.error('Error setting webhook:', err);
  }
};

app.listen(PORT, () => {
  logger.info(`Server is running on ${apiURL}`);
  setWebhook();
});

app.use(errorHandler);
