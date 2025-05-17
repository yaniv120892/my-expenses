import TransactionNotifierFactory from '../services/transactionNotification/transactionNotifierFactory';
import AIServiceFactory from '../services/ai/aiServiceFactory';
import transactionService from '../services/transactionService';

class SummaryController {
  private transactionNotifier = TransactionNotifierFactory.getNotifier();
  private aiProvider = AIServiceFactory.getAIService();

  public async sendTodaySummary() {
    const fullSummaryMessage = await this.getSummaryMessage();
    await this.transactionNotifier.sendDailySummary(fullSummaryMessage);
  }

  private async getAllTodayTransactions() {
    const transactions = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let hasMoreTransactions = true;
    let page = 1;
    const perPage = 100;
    while (hasMoreTransactions) {
      const transactionsPage = await transactionService.getTransactions({
        startDate: start,
        endDate: end,
        page,
        perPage,
        transactionType: 'EXPENSE',
        status: 'APPROVED',
      });
      transactions.push(...transactionsPage);
      if (transactionsPage.length < perPage) {
        hasMoreTransactions = false;
      }
      page++;
    }

    return transactions;
  }

  private async getSummaryMessage() {
    const transactions = await this.getAllTodayTransactions();
    if (transactions.length === 0) {
      return 'No transactions added today.';
    }
    const transactionsText = transactions
      .map(
        (t) =>
          `description:${t.description}, category: ${t.category?.name}, amount: ${t.value}`,
      )
      .join('\n');
    const aiInsights = await this.aiProvider.analyzeExpenses(
      transactionsText,
      'add a funny summary based on my expenses at the end',
    );
    const fullSummaryMessage = `*Today's expenses:*\n${transactionsText}\n\n*AI Insights:*\n${aiInsights}`;
    return fullSummaryMessage;
  }
}

export default new SummaryController();
