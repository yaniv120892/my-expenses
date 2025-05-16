"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactionCreatedNotifier_1 = require("./transactionCreatedNotifier");
const telegramTransactionCreatedNotifier_1 = require("./telegramTransactionCreatedNotifier");
class TransactionCreatedNotifierFactory {
    static getNotifier() {
        const notifierType = process.env.TRANSACTION_CREATED_NOTIFIER_TYPE ||
            transactionCreatedNotifier_1.TransactionCreatedNotifierType.TELEGRAM;
        switch (notifierType) {
            case transactionCreatedNotifier_1.TransactionCreatedNotifierType.TELEGRAM:
            default:
                return new telegramTransactionCreatedNotifier_1.TelegramTransactionCreatedNotifier();
        }
    }
}
exports.default = TransactionCreatedNotifierFactory;
