"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTransaction = formatTransaction;
/** Formats a transaction into a Telegram-friendly message */
function formatTransaction(transaction) {
    var _a;
    const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
    return `📉 ${transaction.description} - ${transaction.value}
📂 ${((_a = transaction.category) === null || _a === void 0 ? void 0 : _a.name) || 'N/A'}  📅 ${formattedDate}`;
}
