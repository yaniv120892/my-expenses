"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactionNotifier_1 = require("./transactionNotifier");
const telegramTransactionNotifier_1 = require("./telegramTransactionNotifier");
class TransactionNotifierFactory {
    static getNotifier() {
        const notifierType = process.env.TRANSACTION_CREATED_NOTIFIER_TYPE ||
            transactionNotifier_1.TransactionNotifierType.TELEGRAM;
        switch (notifierType) {
            case transactionNotifier_1.TransactionNotifierType.TELEGRAM:
            default:
                return new telegramTransactionNotifier_1.TelegramTransactionNotifier();
        }
    }
}
exports.default = TransactionNotifierFactory;
