import { WebhookRequest } from './requests';
import { transactionManager } from '../services/transactionManager';
import logger from '../utils/logger';
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';

class WebhookController {
  async handleWebhook(req: WebhookRequest) {
    const chatId = req.message.chat.id;
    const text = req.message.text;
    const sanitizedText = text?.toLowerCase().trim();

    try {
      if (!sanitizedText) {
        return { message: 'Please enter a valid command.' };
      }

      const [command, ...args] = sanitizedText.split(' ');

      switch (command) {
        case '/start':
          return {
            message: `Welcome to the transaction bot.
1. /create - Create a new transaction.
2. /list <days> - List transactions from the last <days> days (default: 10 days).
3. /summary - Get a summary of your income and expenses.
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
6. /reset - Reset the state.
7. /help - Show available commands.`,
          };

        case '/help':
          return {
            message: `Available commands:
1. /create - Create a transaction.
2. /list <days> - List transactions from the last <days> days (default: 10).
3. /summary - Get a summary of your transactions.
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
6. /reset - Reset user state.`,
          };

        case '/create':
          transactionManager.resetUserState(chatId);
          return transactionManager.handleUserState(chatId, sanitizedText);

        case '/list': {
          const days = args.length ? parseInt(args[0]) || 10 : 10;
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          const transactions = await transactionService.getTransactions({
            startDate,
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
            .join('\n\n');

          return { message: transactionString || 'No transactions found.' };
        }

        case '/summary': {
          const summary = await transactionService.getTransactionsSummary({});
          return {
            message: `Transaction Summary:
*Total Income*: ${summary.totalIncome}
*Total Expense*: ${summary.totalExpense}`,
          };
        }

        case '/categories': {
          const categories = await categoryService.list();
          const categoryList = categories
            .map((c) => `*${c.id}*: ${c.name}`)
            .join('\n');
          return { message: `Available Categories:\n${categoryList}` };
        }

        case '/delete': {
          if (!args.length) {
            return { message: 'Please provide a transaction ID to delete.' };
          }

          const transactionId = args[0];
          try {
            await transactionService.deleteTransaction(transactionId);
            return {
              message: `Transaction ${transactionId} deleted successfully.`,
            };
          } catch (error) {
            return {
              message: `Failed to delete transaction: ${JSON.stringify(error)}`,
            };
          }
        }

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
