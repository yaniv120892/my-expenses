import { telegramService } from '../services/telegramService';
import aiServiceFactory from '../services/ai/aiServiceFactory';
import transactionService from '../services/transactionService';

class InsightsHandler {
  private aiService;

  constructor() {
    this.aiService = aiServiceFactory.getAIService();
  }

  async handleInsights(chatId: string, userId: string | null) {
    if (!userId) {
      return telegramService.sendMessage(chatId, 'Please provide a user ID');
    }
    await telegramService.sendMessage(chatId, '🔄 Analyzing your expenses...');

    const transactions = await transactionService.getTransactions({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      transactionType: 'EXPENSE',
      page: 1,
      perPage: 100,
      userId,
    });

    if (transactions.length === 0) {
      return telegramService.sendMessage(chatId, '❌ No transactions found.');
    }

    const expenseSummary = transactions
      .map(
        (t) =>
          `${t.date.toISOString().split('T')[0]} - ${t.description}: $${t.value}`,
      )
      .join('\n');
    const insights = await this.aiService.analyzeExpenses(expenseSummary);

    await telegramService.sendMessage(
      chatId,
      `💡 *Expense Insights:*\n${insights}`,
    );
  }
}

export const insightsHandler = new InsightsHandler();
