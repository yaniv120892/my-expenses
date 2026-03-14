import { Transaction } from '../types/transaction';
import { AggregationType, AggregationResult } from '../types/chat';

class ChatAggregationService {
  public aggregate(
    transactions: Transaction[],
    aggregationType: AggregationType,
  ): AggregationResult {
    switch (aggregationType) {
      case 'total':
        return this.computeTotal(transactions);
      case 'average':
        return this.computeAverage(transactions);
      case 'count':
        return this.computeCount(transactions);
      case 'breakdown_by_category':
        return this.computeCategoryBreakdown(transactions);
      case 'breakdown_by_month':
        return this.computeMonthlyBreakdown(transactions);
      case 'min_max':
        return this.computeMinMax(transactions);
      case 'list':
        return this.formatList(transactions);
    }
  }

  private computeTotal(transactions: Transaction[]): AggregationResult {
    const income = this.sumByType(transactions, 'INCOME');
    const expense = this.sumByType(transactions, 'EXPENSE');
    const net = income - expense;

    const lines = [
      `Total Income: ${this.formatCurrency(income)}`,
      `Total Expenses: ${this.formatCurrency(expense)}`,
      `Net: ${this.formatCurrency(net)}`,
    ];

    return {
      summary: lines.join('\n'),
      data: { income, expense, net },
      transactionCount: transactions.length,
    };
  }

  private computeAverage(transactions: Transaction[]): AggregationResult {
    if (transactions.length === 0) {
      return {
        summary: 'No transactions found to calculate an average.',
        data: { average: 0 },
        transactionCount: 0,
      };
    }

    const total = transactions.reduce((sum, t) => sum + t.value, 0);
    const average = Math.round((total / transactions.length) * 100) / 100;

    return {
      summary: `Average transaction value: ${this.formatCurrency(average)} (across ${transactions.length} transactions, total: ${this.formatCurrency(total)})`,
      data: { average, total, count: transactions.length },
      transactionCount: transactions.length,
    };
  }

  private computeCount(transactions: Transaction[]): AggregationResult {
    const incomeCount = transactions.filter(
      (t) => t.type === 'INCOME',
    ).length;
    const expenseCount = transactions.filter(
      (t) => t.type === 'EXPENSE',
    ).length;

    return {
      summary: `Total transactions: ${transactions.length} (${incomeCount} income, ${expenseCount} expenses)`,
      data: { total: transactions.length, incomeCount, expenseCount },
      transactionCount: transactions.length,
    };
  }

  private computeCategoryBreakdown(
    transactions: Transaction[],
  ): AggregationResult {
    const byCategory = new Map<string, number>();
    for (const t of transactions) {
      const name = t.category.name;
      byCategory.set(name, (byCategory.get(name) || 0) + t.value);
    }

    const sorted = [...byCategory.entries()].sort(([, a], [, b]) => b - a);
    const lines = sorted.map(
      ([name, amount]) => `  ${name}: ${this.formatCurrency(amount)}`,
    );
    const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);

    return {
      summary: `Spending by category:\n${lines.join('\n')}\n\nTotal: ${this.formatCurrency(total)}`,
      data: Object.fromEntries(sorted),
      transactionCount: transactions.length,
    };
  }

  private computeMonthlyBreakdown(
    transactions: Transaction[],
  ): AggregationResult {
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
      const month = new Date(t.date).toISOString().slice(0, 7);
      byMonth.set(month, (byMonth.get(month) || 0) + t.value);
    }

    const sorted = [...byMonth.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const lines = sorted.map(
      ([month, amount]) => `  ${month}: ${this.formatCurrency(amount)}`,
    );

    return {
      summary: `Monthly breakdown:\n${lines.join('\n')}`,
      data: Object.fromEntries(sorted),
      transactionCount: transactions.length,
    };
  }

  private computeMinMax(transactions: Transaction[]): AggregationResult {
    if (transactions.length === 0) {
      return {
        summary: 'No transactions found.',
        data: {},
        transactionCount: 0,
      };
    }

    const sorted = [...transactions].sort((a, b) => b.value - a.value);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    return {
      summary: [
        `Highest: ${this.formatCurrency(highest.value)} — "${highest.description}" (${highest.category.name}, ${this.formatDate(highest.date)})`,
        `Lowest: ${this.formatCurrency(lowest.value)} — "${lowest.description}" (${lowest.category.name}, ${this.formatDate(lowest.date)})`,
      ].join('\n'),
      data: {
        highestValue: highest.value,
        highestDescription: highest.description,
        lowestValue: lowest.value,
        lowestDescription: lowest.description,
      },
      transactionCount: transactions.length,
    };
  }

  private formatList(transactions: Transaction[]): AggregationResult {
    const top = transactions.slice(0, 10);
    const total = transactions.reduce((sum, t) => sum + t.value, 0);

    const lines = top.map(
      (t) =>
        `  - ${this.formatDate(t.date)} | ${t.description} | ${this.formatCurrency(t.value)} | ${t.category.name} (${t.type})`,
    );

    const summaryParts = [
      `Showing ${top.length} of ${transactions.length} transactions:`,
      ...lines,
    ];
    if (transactions.length > 10) {
      summaryParts.push(`  ... and ${transactions.length - 10} more`);
    }
    summaryParts.push(`\nTotal value: ${this.formatCurrency(total)}`);

    return {
      summary: summaryParts.join('\n'),
      data: { shown: top.length, total: transactions.length, totalValue: total },
      transactionCount: transactions.length,
    };
  }

  private sumByType(
    transactions: Transaction[],
    type: 'INCOME' | 'EXPENSE',
  ): number {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.value, 0);
  }

  private formatCurrency(amount: number): string {
    return `₪${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}

export default new ChatAggregationService();
