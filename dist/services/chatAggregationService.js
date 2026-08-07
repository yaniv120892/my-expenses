"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChatAggregationService {
    /**
     * Compares two periods and returns the difference and percentage change.
     *
     * Derived figures are computed here rather than left to the model. Without
     * this, answering "how much more did I spend in February?" would mean handing
     * the assistant two totals and having it do the subtraction itself.
     */
    computeComparison(periodA, periodB) {
        const totalA = this.sumValues(periodA.transactions);
        const totalB = this.sumValues(periodB.transactions);
        const difference = this.round(totalB - totalA);
        const lines = [
            `${periodA.label}: ${this.formatCurrency(totalA)} (${this.pluralize(periodA.transactions.length, 'transaction')})`,
            `${periodB.label}: ${this.formatCurrency(totalB)} (${this.pluralize(periodB.transactions.length, 'transaction')})`,
            `Difference: ${difference >= 0 ? '+' : '-'}${this.formatCurrency(Math.abs(difference))} (${periodB.label} vs ${periodA.label})`,
        ];
        const data = {
            [`${periodA.label} total`]: totalA,
            [`${periodB.label} total`]: totalB,
            difference,
        };
        // A percentage change against a zero baseline is undefined, not infinite.
        if (totalA === 0) {
            lines.push(totalB === 0
                ? 'Percentage change: not applicable (both periods are zero)'
                : `Percentage change: not applicable (${periodA.label} has no transactions to compare against)`);
        }
        else {
            const percentChange = this.round((difference / totalA) * 100);
            lines.push(`Percentage change: ${percentChange >= 0 ? '+' : ''}${percentChange}%`);
            data.percentChange = percentChange;
        }
        return {
            summary: lines.join('\n'),
            data,
            transactionCount: periodA.transactions.length + periodB.transactions.length,
        };
    }
    aggregate(transactions, aggregationType) {
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
    computeTotal(transactions) {
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
    computeAverage(transactions) {
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
    computeCount(transactions) {
        const incomeCount = transactions.filter((t) => t.type === 'INCOME').length;
        const expenseCount = transactions.filter((t) => t.type === 'EXPENSE').length;
        return {
            summary: `Total transactions: ${transactions.length} (${incomeCount} income, ${expenseCount} expenses)`,
            data: { total: transactions.length, incomeCount, expenseCount },
            transactionCount: transactions.length,
        };
    }
    computeCategoryBreakdown(transactions) {
        const byCategory = new Map();
        for (const t of transactions) {
            const name = t.category.name;
            byCategory.set(name, (byCategory.get(name) || 0) + t.value);
        }
        const sorted = [...byCategory.entries()].sort(([, a], [, b]) => b - a);
        const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);
        // Shares are computed here so "what percentage went to rent?" is answered
        // from a tool result rather than by dividing two numbers in the model.
        const lines = sorted.map(([name, amount]) => {
            const share = total === 0 ? 0 : this.round((amount / total) * 100);
            return `  ${name}: ${this.formatCurrency(amount)} (${share}%)`;
        });
        const data = {};
        for (const [name, amount] of sorted) {
            data[name] = amount;
            data[`${name} %`] = total === 0 ? 0 : this.round((amount / total) * 100);
        }
        return {
            summary: `Spending by category:\n${lines.join('\n')}\n\nTotal: ${this.formatCurrency(total)}`,
            data,
            transactionCount: transactions.length,
        };
    }
    computeMonthlyBreakdown(transactions) {
        const byMonth = new Map();
        for (const t of transactions) {
            const month = new Date(t.date).toISOString().slice(0, 7);
            byMonth.set(month, (byMonth.get(month) || 0) + t.value);
        }
        const sorted = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
        const lines = sorted.map(([month, amount]) => `  ${month}: ${this.formatCurrency(amount)}`);
        return {
            summary: `Monthly breakdown:\n${lines.join('\n')}`,
            data: Object.fromEntries(sorted),
            transactionCount: transactions.length,
        };
    }
    computeMinMax(transactions) {
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
    formatList(transactions) {
        const top = transactions.slice(0, 10);
        const total = transactions.reduce((sum, t) => sum + t.value, 0);
        const lines = top.map((t) => `  - ${this.formatDate(t.date)} | ${t.description} | ${this.formatCurrency(t.value)} | ${t.category.name} (${t.type})`);
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
            data: {
                shown: top.length,
                total: transactions.length,
                totalValue: total,
            },
            transactionCount: transactions.length,
        };
    }
    sumByType(transactions, type) {
        return transactions
            .filter((t) => t.type === type)
            .reduce((sum, t) => sum + t.value, 0);
    }
    sumValues(transactions) {
        return this.round(transactions.reduce((sum, t) => sum + t.value, 0));
    }
    round(value) {
        return Math.round(value * 100) / 100;
    }
    pluralize(count, noun) {
        return `${count} ${noun}${count === 1 ? '' : 's'}`;
    }
    formatCurrency(amount) {
        return `₪${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    formatDate(date) {
        return new Date(date).toISOString().split('T')[0];
    }
}
exports.default = new ChatAggregationService();
