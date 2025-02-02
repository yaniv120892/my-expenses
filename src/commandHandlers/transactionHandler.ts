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

  async handleList(chatId: number, args: string[]) {
    const days = args.length ? parseInt(args[0]) || 5 : 5;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await transactionService.getTransactions({
      startDate,
      transactionType: 'EXPENSE',
      page: 1,
      perPage: 10,
    });

    if (transactions.length === 0) {
      return telegramService.sendMessage(chatId, 'No transactions found.');
    }

    const transactionList = transactions
      .map((transaction) => formatTransaction(transaction))
      .join('\n\n');

    return telegramService.sendMessage(chatId, transactionList);
  }

  async handleSummary(chatId: number, args: string[]) {
    const days = args.length ? parseInt(args[0]) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const summary = await transactionService.getTransactionsSummary({
      startDate,
    });

    return telegramService.sendMessage(
      chatId,
      `📊 *Transaction Summary:*\n💰 Income: $${summary.totalIncome.toLocaleString()}\n💸 Expenses: $${summary.totalExpense.toLocaleString()}`,
    );
  }

  async handleSearch(chatId: number, args: string[]) {
    if (args.length === 0) {
      return telegramService.sendMessage(
        chatId,
        'Please provide a search term.',
      );
    }

    const transactions = await transactionService.getTransactions({
      searchTerm: args.join(' '),
      page: 1,
      perPage: 10,
    });
    if (transactions.length === 0) {
      return telegramService.sendMessage(
        chatId,
        `No transactions found for "${args.join(' ')}".`,
      );
    }

    const transactionList = transactions
      .map((transaction) => formatTransaction(transaction))
      .join('\n\n');

    return telegramService.sendMessage(
      chatId,
      `🔍 *Search results for:* "${args.join(' ')}"\n\n${transactionList}`,
    );
  }
}

export const transactionHandler = new TransactionHandler();
