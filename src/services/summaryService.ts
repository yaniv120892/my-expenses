import transactionRepository from '../repositories/transactionRepository';
import aiServiceFactory from './ai/aiServiceFactory';

class SummaryService {
  private aiService = aiServiceFactory.getAIService();

  public async getTodaySummary(userId: string) {
    const transactions = await this.getTodayTransactions(userId);
    const summary = this.buildSummary(transactions);
    const aiSummary = await this.getFunnyAiSummary(transactions);
    return { summary, aiSummary };
  }

  private getTodayDateRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  private async getTodayTransactions(userId: string) {
    const { start, end } = this.getTodayDateRange();
    return transactionRepository.getTransactions({
      startDate: start,
      endDate: end,
      page: 1,
      perPage: 100,
      status: 'APPROVED',
      userId,
    });
  }

  private buildSummary(transactions: any[]) {
    const total = transactions.reduce((sum, t) => sum + t.value, 0);
    return `Today's expenses: ${total.toFixed(2)} NIS (${transactions.length} transactions)`;
  }

  private async getFunnyAiSummary(transactions: any[]) {
    const descriptions = transactions
      .map((t) => `${t.description} (${t.category?.name})`)
      .join(', ');
    const prompt = `Write a short and funny summary about these expenses: ${descriptions}`;
    return this.aiService.analyzeExpenses(prompt);
  }
}

export default new SummaryService();
