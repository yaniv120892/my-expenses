import { Transaction } from '../types/transaction';

/** Formats a transaction into a Telegram-friendly message */
export function formatTransaction(transaction: Transaction): string {
  const formattedDate = new Date(transaction.date).toISOString().split('T')[0];

  return `📉 ${transaction.description} - ${transaction.value}
📂 ${transaction.category?.name || 'N/A'}  📅 ${formattedDate}`;
}
