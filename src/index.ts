import * as dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import router from './routers/index';
import logger, { requestLogger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const PORT = process.env.PORT || 3001;
const apiURL = process.env.API_URL || `http://localhost:${PORT}`;

const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
const bot = new TelegramBot(token);

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/', router);

const setWebhook = async () => {
  // Skip entirely when no bot is configured. Registering a webhook with the
  // placeholder token reaches out to api.telegram.org, and when that host is
  // unreachable the underlying socket emits an 'error' the try/catch below
  // never sees — an unhandled event that takes the whole process down at
  // startup. Nothing to register without a real token anyway.
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN is not set, skipping webhook registration');
    return;
  }

  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3001/webhook';

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
