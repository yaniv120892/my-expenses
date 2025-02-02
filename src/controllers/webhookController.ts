import { WebhookRequest } from './requests';
import { transactionManager, UserStatus } from '../services/transactionManager';
import logger from '../utils/logger';
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';
import { aiService } from '../services/aiService';

class WebhookController {
  async handleWebhook(req: WebhookRequest) {
    const chatId = req.message.chat.id;
    const text = req.message.text?.toLowerCase().trim();

    if (!text) return this.createResponse('Please enter a valid command.');

    const [command, ...args] = text.split(' ');

    try {
      switch (command) {
        case '/start':
          return this.handleStart(chatId);

        case '/help':
          return this.handleHelp(chatId);

        case '/create':
          return await this.handleCreate(chatId);

        case '/list':
          return await this.handleList(chatId, args);

        case '/summary':
          return await this.handleSummary(chatId);

        case '/categories':
          return await this.handleCategories(chatId);

        case '/delete':
          return await this.handleDelete(chatId, args);

        case '/reset':
          return this.handleReset(chatId);

        case '/insights':
          return await this.handleInsights();
        default:
          return await this.handleUserState(chatId, text);
      }
    } catch (error) {
      logger.error('Failed to handle webhook:', error);
      return this.createResponse(`Failed to handle command: ${command}`);
    }
  }

  /** Helper to create response messages with available options */
  private createResponse(message: string, showOptions: boolean = true) {
    return {
      message: showOptions
        ? `${message}\n\n${this.getOptionsMessage()}`
        : message,
    };
  }

  /** Returns the options menu */
  private getOptionsMessage(): string {
    return `Available commands:
1. /create - Create a new transaction.
2. /list <days> - List transactions from the last <days> days (default: 10).
3. /summary - Get a summary of your transactions.
4. /categories - List available transaction categories.
5. /delete <transaction_id> - Delete a specific transaction.
6. /reset - Reset user state.
7. /insights - Get AI-generated expense insights.
8. /help - Show available commands.`;
  }

  /** Handles /start command */
  private handleStart(chatId: number) {
    transactionManager.resetUserState(chatId);
    return this.createResponse(
      `Welcome to the transaction bot. You can manage your expenses using the commands below.`,
    );
  }

  /** Handles /help command */
  private handleHelp(chatId: number) {
    transactionManager.resetUserState(chatId);
    return this.createResponse(`Here are the available commands.`);
  }

  /** Handles /create command */
  private async handleCreate(chatId: number) {
    const { message, nextStep } = await transactionManager.handleUserState(
      chatId,
      '/create',
    );
    return this.createResponse(message, nextStep !== UserStatus.FAILURE);
  }

  /** Handles /list <days> command */
  private async handleList(chatId: number, args: string[]) {
    transactionManager.resetUserState(chatId);
    const days = args.length ? parseInt(args[0]) || 10 : 10;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await transactionService.getTransactions({
      startDate,
      transactionType: 'EXPENSE',
      page: 1,
      perPage: 10,
    });

    if (transactions.length === 0) {
      return this.createResponse('No transactions found.');
    }

    const transactionList = transactions
      .map(
        (t) => `*Description*: ${t.description}
*Value*: ${t.value} 
*Date*: ${new Date(t.date).toISOString().split('T')[0]}
*Type*: ${t.type}
*Category*: ${t.category.name}`,
      )
      .join('\n\n');

    return this.createResponse(transactionList);
  }

  /** Handles /summary command */
  private async handleSummary(chatId: number) {
    transactionManager.resetUserState(chatId);
    const summary = await transactionService.getTransactionsSummary({});
    return this.createResponse(
      `Transaction Summary:\n*Total Income*: ${summary.totalIncome}\n*Total Expense*: ${summary.totalExpense}`,
    );
  }

  /** Handles /categories command */
  private async handleCategories(chatId: number) {
    transactionManager.resetUserState(chatId);
    const categories = await categoryService.list();

    if (categories.length === 0) {
      return this.createResponse('No categories found.');
    }

    const categoryList = categories
      .map((c) => `*${c.id}*: ${c.name}`)
      .join('\n');
    return this.createResponse(`Available Categories:\n${categoryList}`);
  }

  /** Handles /delete <transaction_id> command */
  private async handleDelete(chatId: number, args: string[]) {
    transactionManager.resetUserState(chatId);

    if (!args.length) {
      return this.createResponse('Please provide a transaction ID to delete.');
    }

    const transactionId = args[0];

    try {
      await transactionService.deleteTransaction(transactionId);
      return this.createResponse(
        `Transaction ${transactionId} deleted successfully.`,
      );
    } catch (error) {
      logger.error(`Failed to delete transaction ${transactionId}`, error);
      return this.createResponse(
        `Failed to delete transaction ${transactionId}.`,
      );
    }
  }

  /** Handles /reset command */
  private handleReset(chatId: number) {
    transactionManager.resetUserState(chatId);
    return this.createResponse('State has been reset.');
  }

  /** Handles /insights command */
  private async handleInsights() {
    const transactions = await transactionService.getTransactions({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      transactionType: 'EXPENSE',
      page: 1,
      perPage: 20,
    });

    if (transactions.length === 0) {
      return this.createResponse('No transactions found.');
    }

    const expenseSummary = transactions
      .map(
        (t) =>
          `${t.date.toISOString().split('T')[0]} - ${t.description}: $${t.value}`,
      )
      .join('\n');

    const insights = await aiService.analyzeExpenses(expenseSummary);

    return this.createResponse(`💡 Expense Insights:\n${insights}`);
  }

  /** Handles user state progression (handles transaction creation flow) */
  private async handleUserState(chatId: number, text: string) {
    const { message, nextStep } = await transactionManager.handleUserState(
      chatId,
      text,
    );

    if (nextStep === UserStatus.TRANSACTION_COMPLETE) {
      return this.createResponse(
        `${message}\n\n🎉 Transaction successfully recorded!`,
        true,
      );
    }

    if (nextStep === UserStatus.FAILURE) {
      return this.createResponse(
        `❌ Transaction failed. Please try again.`,
        true,
      );
    }

    return this.createResponse(message, false);
  }
}

export const webhookController = new WebhookController();
