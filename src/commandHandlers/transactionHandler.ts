import { transactionManager } from '../services/transactionManager';
import transactionService from '../services/transactionService';
import { telegramService } from '../services/telegramService';
import { formatTransaction } from '../utils/transactionUtils';

class TransactionHandler {
  async handleCreate(chatId: number) {
    const { message } = await transactionManager.handleUserState(
      chatId,
      '/create',
    );
    return telegramService.sendMessage(chatId, message);
  }

  async handleList(chatId: number, userId: string | null, days?: number) {
    if (!userId) {
      return telegramService.sendMessage(chatId, 'Please provide a user ID');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days || 5));

    const transactions = await transactionService.getTransactions({
      startDate,
      transactionType: 'EXPENSE',
      page: 1,
      perPage: 10,
      userId: userId,
    });

    if (transactions.length === 0) {
      return telegramService.sendMessage(chatId, 'No transactions found.');
    }

    const transactionList = transactions
      .map((transaction) => formatTransaction(transaction))
      .join('\n\n');

    await telegramService.sendMessage(chatId, transactionList);
  }

  async handleSummary(chatId: number, userId: string | null, days?: number) {
    if (!userId) {
      return telegramService.sendMessage(chatId, 'Please provide a user ID');
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days || 30));

    const summary = await transactionService.getTransactionsSummary({
      startDate,
      userId,
    });
    await telegramService.sendMessage(
      chatId,
      `📊 *Transaction Summary:*\n💰 Income: $${summary.totalIncome.toLocaleString()}\n💸 Expenses: $${summary.totalExpense.toLocaleString()}`,
    );
  }

  async handleSearch(
    chatId: number,
    userId: string | null,
    searchTerm: string,
  ) {
    if (!searchTerm) {
      return telegramService.sendMessage(
        chatId,
        'Please provide a search term.',
      );
    }
    if (!userId) {
      return telegramService.sendMessage(chatId, 'Please provide a user ID');
    }

    const transactions = await transactionService.getTransactions({
      searchTerm: searchTerm,
      page: 1,
      perPage: 10,
      userId,
    });
    if (transactions.length === 0) {
      return telegramService.sendMessage(
        chatId,
        `No transactions found for "${searchTerm}".`,
      );
    }

    const transactionList = transactions
      .map((transaction) => formatTransaction(transaction))
      .join('\n\n');

    await telegramService.sendMessage(
      chatId,
      `🔍 *Search results for:* "${searchTerm}"\n\n${transactionList}`,
    );
  }
}

export const transactionHandler = new TransactionHandler();
