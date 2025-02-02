import { WebhookRequest } from './requests';
import { transactionManager, UserStatus } from '../services/transactionManager';
import logger from '../utils/logger';
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';
import aiServiceFactory from '../services/ai/aiServiceFactory';

const defaultListDays = 5;
const defaultSummaryDays = 30;

class WebhookController {
  private aiService = aiServiceFactory.getAIService();

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
          return await this.handleSummary(chatId, args);

        case '/categories':
          return await this.handleCategories(chatId);

        case '/delete':
          return await this.handleDelete(chatId, args);

        case '/update':
          return await this.handleUpdate(chatId, args);

        case '/insights':
          return await this.handleInsights();

        case '/reset':
          return this.handleReset(chatId);

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
2. /list <days> - List transactions from the last <days> days (default: ${defaultListDays}).
3. /summary <days> - Get a summary of your transactions from the last <days> days (default: ${defaultSummaryDays}).
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
    const days = args.length
      ? parseInt(args[0]) || defaultListDays
      : defaultListDays;

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
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((t) => {
        const formattedDate = new Date(t.date).toISOString().split('T')[0];

        return `\u200F${this.getTransactionTypeIcon(t.type)} ${t.description} ${t.value}
\u200Fקטגוריה: ${t.category.name}
\u200F${formattedDate}

🗑 /delete ${t.id}
✏️ /update ${t.id}`;
      })
      .join('\n\n');

    return this.createResponse(transactionList);
  }

  /** Handles /summary command */
  private async handleSummary(chatId: number, args: string[]) {
    transactionManager.resetUserState(chatId);

    const startDate = new Date();
    const days = args.length ? parseInt(args[0]) : defaultSummaryDays;
    startDate.setDate(startDate.getDate() - days);

    const summary = await transactionService.getTransactionsSummary({
      startDate,
    });

    // Format numbers with commas (thousands separators)
    const formatter = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    });

    return this.createResponse(
      `📊 Transaction Summary:\n` +
        `${this.getTransactionTypeIcon('INCOME')} Total Income: ${formatter.format(summary.totalIncome)}\n` +
        `${this.getTransactionTypeIcon('EXPENSE')} Total Expense: ${formatter.format(summary.totalExpense)}`,
    );
  }

  /** Handles /categories command */
  private async handleCategories(chatId: number) {
    transactionManager.resetUserState(chatId);
    const categories = await categoryService.list();

    if (categories.length === 0) {
      return this.createResponse('No categories found.');
    }

    const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join('\n');
    return this.createResponse(`Available Categories:\n${categoryList}`);
  }

  /** Handles /delete <transaction_id> command */
  private async handleDelete(chatId: number, args: string[]) {
    transactionManager.resetUserState(chatId);

    let transactionId = args[0];

    // If command comes as "/delete_<transactionId>", extract the ID
    if (!transactionId && chatId.toString().includes('_')) {
      transactionId = chatId.toString().split('_')[1];
    }

    if (!transactionId) {
      return this.createResponse('Please provide a transaction ID to delete.');
    }

    try {
      await transactionService.deleteTransaction(transactionId);
      return this.createResponse(
        `✅ Transaction ${transactionId} deleted successfully.`,
      );
    } catch (error) {
      logger.error(`Failed to delete transaction ${transactionId}`, error);
      return this.createResponse(
        `❌ Failed to delete transaction ${transactionId}.`,
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
      perPage: 100,
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

    const insights = await this.aiService.analyzeExpenses(expenseSummary);

    return this.createResponse(`💡 Expense Insights:\n${insights}`);
  }

  /** Handles user state progression (handles transaction creation flow) */
  private async handleUserState(chatId: number, text: string) {
    logger.debug(`Handling user state for chatId: ${chatId}, text: ${text}`);
    const sanitizedText = text.replace('/', '').trim();

    const { message, nextStep } = await transactionManager.handleUserState(
      chatId,
      sanitizedText,
    );

    let response = { message: 'Failed to handle user state.' };
    switch (nextStep) {
      case UserStatus.AWAITING_TYPE:
      case UserStatus.AWAITING_AMOUNT:
      case UserStatus.AWAITING_DESCRIPTION:
      case UserStatus.AWAITING_DATE:
        response = this.createResponse(message, false);
        break;
      case UserStatus.TRANSACTION_COMPLETE:
        response = this.createResponse(message, true);
        break;
      case UserStatus.FAILURE:
        response = this.createResponse(
          '❌ Transaction failed. Please try again.',
          true,
        );
        break;
    }

    logger.debug(`User state response: ${response.message}`);
    return response;
  }

  /** Handles /update <transaction_id> command */
  private async handleUpdate(chatId: number, args: string[]) {
    transactionManager.resetUserState(chatId);

    let transactionId = args[0];

    // Extract transactionId from "/update_<transactionId>"
    if (!transactionId && chatId.toString().includes('_')) {
      transactionId = chatId.toString().split('_')[1];
    }

    if (!transactionId) {
      return this.createResponse('Please provide a transaction ID to update.');
    }

    return this.createResponse(
      `You selected to update transaction ${transactionId}.\nUse the following commands to update:\n\n` +
        `/update ${transactionId} description <new_description>\n` +
        `/update ${transactionId} value <new_value>\n` +
        `/update ${transactionId} categoryId <new_category_id>\n`,
    );
  }

  private getTransactionTypeIcon(type: string) {
    return type === 'EXPENSE' ? '📉' : '📈';
  }
}

export const webhookController = new WebhookController();
