import TransactionNotifierFactory from '../services/transactionNotification/transactionNotifierFactory';
import AIServiceFactory from '../services/ai/aiServiceFactory';
import transactionService from '../services/transactionService';
import { Transaction } from 'types/transaction';

class SummaryController {
  private transactionNotifier = TransactionNotifierFactory.getNotifier();
  private aiProvider = AIServiceFactory.getAIService();

  public async sendTodaySummary() {
    const users = await this.getUsersRequiredSummary();
    for (const userId of users) {
      const fullSummaryMessage = await this.getSummaryMessage(userId);
      await this.transactionNotifier.sendDailySummary(
        fullSummaryMessage,
        userId,
      );
    }
  }

  private async getAllTodayTransactions(userId: string) {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const transactionsToday = await transactionService.getAllTransactions({
      startDate: startOfToday,
      endDate: endOfToday,
      userId,
    });

    return transactionsToday;
  }

  private formatTransactionList(transactions: Transaction[]) {
    return transactions
      .map((transaction) => {
        const description = transaction.description || '';
        const category = transaction.category?.name || '';
        const amount = transaction.value || 0;
        return `${category}, ${description}, ${amount} ש״ח`;
      })
      .join('\n');
  }

  private formatTotalAmount(totalAmount: number) {
    return `*סך הכל הוצאות:*\n${totalAmount} ש״ח\n`;
  }

  private formatAiInsights(aiInsights: string) {
    return `*סיכום:*\n${aiInsights}`;
  }

  private formatSummaryMessage(
    transactions: Transaction[],
    totalAmount: number,
    aiInsights: string,
  ) {
    const transactionList = this.formatTransactionList(transactions);
    const totalAmountSection = this.formatTotalAmount(totalAmount);
    const aiInsightsSection = this.formatAiInsights(aiInsights);

    return [
      '*ההוצאות של היום:*',
      transactionList,
      '',
      totalAmountSection,
      '',
      aiInsightsSection,
    ].join('\n');
  }

  private async getSummaryMessage(userId: string) {
    const transactions = await this.getAllTodayTransactions(userId);
    if (transactions.length === 0) {
      return 'לא נוספו הוצאות היום.';
    }
    const transactionsTextForAiAnalyzer = transactions
      .map(
        (t) =>
          `description:${t.description}, category: ${t.category?.name}, amount: ${t.value}`,
      )
      .join('\n');
    const aiInsights = await this.aiProvider.analyzeExpenses(
      transactionsTextForAiAnalyzer,
      'add a funny summary based on my expenses at the end',
    );
    const total = transactions.reduce((sum, t) => sum + t.value, 0);
    return this.formatSummaryMessage(transactions, total, aiInsights);
  }

  private async getUsersRequiredSummary() {
    //TODO: Implement logic to get users who require summary
    return ['f9c8bf03-3085-4431-a35d-ee388470d0eb'];
  }
}

export default new SummaryController();
