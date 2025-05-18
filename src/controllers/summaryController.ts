import TransactionNotifierFactory from '../services/transactionNotification/transactionNotifierFactory';
import AIServiceFactory from '../services/ai/aiServiceFactory';
import transactionService from '../services/transactionService';
import { Transaction } from 'types/transaction';

class SummaryController {
  private transactionNotifier = TransactionNotifierFactory.getNotifier();
  private aiProvider = AIServiceFactory.getAIService();

  public async sendTodaySummary() {
    const fullSummaryMessage = await this.getSummaryMessage();
    await this.transactionNotifier.sendDailySummary(fullSummaryMessage);
  }

  private async getAllTodayTransactions() {
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

  private async getSummaryMessage() {
    const transactions = await this.getAllTodayTransactions();
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
}

export default new SummaryController();
