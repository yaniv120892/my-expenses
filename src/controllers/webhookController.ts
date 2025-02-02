import { WebhookRequest } from './requests';
import { transactionManager } from '../services/transactionManager'; // Use the new unified service
import logger from '../utils/logger';
import transactionService from '../services/transactionService';

class WebhookController {
  async handleWebhook(req: WebhookRequest) {
    const chatId = req.message.chat.id;
    const text = req.message.text;
    const sanitizedText = text?.toLowerCase().trim();

    try {
      switch (sanitizedText) {
        case undefined:
        case null:
        case '':
          return { message: 'Please enter a valid command.' };
        case '/start':
          return {
            message: `Welcome to the transaction bot.
              1. /create - create a transaction.
              2. /list to list transactions.
              3. /reset to reset the state.`,
          };
        case '/create':
          transactionManager.resetUserState(chatId);
          return transactionManager.handleUserState(chatId, sanitizedText);
        case '/list':
          const startDate = new Date().getDate() - 10;
          const transactions = await transactionService.getTransactions({
            startDate: new Date(startDate),
            transactionType: 'EXPENSE',
            page: 1,
            perPage: 10,
          });

          const transactionString = transactions
            .map((transaction) => {
              const formattedDate = new Date(transaction.date)
                .toISOString()
                .split('T')[0];

              return `*Description*: ${transaction.description}
*Value*: ${transaction.value} 
*Date*: ${formattedDate}
*Type*: ${transaction.type}
*Category*: ${transaction.category.name}`;
            })
            .join('\n\n'); // Join transactions with a double newline for separation

          return {
            message: transactionString || 'No transactions found.',
          };
        case '/reset':
          transactionManager.resetUserState(chatId);
          return { message: 'State has been reset.' };
        default:
          const textWithoutCommand = sanitizedText.replace('/', '');
          return await transactionManager.handleUserState(
            chatId,
            textWithoutCommand,
          );
      }
    } catch (error) {
      logger.error('Failed to handle webhook:', error);
      throw error;
    }
  }
}

export const webhookController = new WebhookController();
