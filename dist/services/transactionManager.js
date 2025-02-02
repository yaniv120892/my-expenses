"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionManager = void 0;
const transactionService_1 = __importDefault(require("./transactionService"));
var UserStatus;
(function (UserStatus) {
    UserStatus["awaiting_type"] = "awaiting_type";
    UserStatus["awaiting_amount"] = "awaiting_amount";
    UserStatus["awaiting_description"] = "awaiting_description";
    UserStatus["awaiting_date"] = "awaiting_date";
})(UserStatus || (UserStatus = {}));
class TransactionManager {
    constructor() {
        this.chatIdToUserStateMapping = new Map();
    }
    async handleUserState(chatId, sanitizedText) {
        const currentState = this.chatIdToUserStateMapping.get(chatId);
        // Initialize user state if not already set or handle reset/start
        if (!currentState) {
            this.chatIdToUserStateMapping.set(chatId, {
                inProcessTransaction: {},
                status: UserStatus.awaiting_type,
            });
            return {
                message: `Please select the transaction type
          1. /expense - to record an expense.
          2. /income - to record an income.`,
            };
        }
        const { inProcessTransaction, status } = currentState;
        switch (status) {
            case UserStatus.awaiting_type: {
                return this.awaitingType(chatId, sanitizedText, inProcessTransaction);
            }
            case UserStatus.awaiting_amount: {
                return this.awaitingAmount(chatId, sanitizedText, inProcessTransaction);
            }
            case UserStatus.awaiting_description: {
                return this.awaitingDescription(chatId, sanitizedText, inProcessTransaction);
            }
            case UserStatus.awaiting_date: {
                return this.awaitingDate(chatId, sanitizedText, inProcessTransaction);
            }
            default: {
                return { message: 'Invalid state' };
            }
        }
    }
    resetUserState(chatId) {
        this.chatIdToUserStateMapping.delete(chatId);
    }
    async awaitingType(chatId, sanitizedText, inProcessTransaction) {
        if (sanitizedText === 'expense' || sanitizedText === 'income') {
            inProcessTransaction.type =
                sanitizedText.toUpperCase();
            this.chatIdToUserStateMapping.set(chatId, {
                inProcessTransaction,
                status: UserStatus.awaiting_amount,
            });
            return {
                message: 'Enter the amount:',
                nextStep: UserStatus.awaiting_amount,
            };
        }
        return {
            message: 'Invalid transaction type. Please type "EXPENSE" or "INCOME".',
        };
    }
    async awaitingAmount(chatId, sanitizedText, inProcessTransaction) {
        if (!isNaN(Number(sanitizedText)) && Number(sanitizedText) > 0) {
            inProcessTransaction.value = Number(sanitizedText);
            this.chatIdToUserStateMapping.set(chatId, {
                inProcessTransaction,
                status: UserStatus.awaiting_description,
            });
            return {
                message: 'Enter the description:',
                nextStep: UserStatus.awaiting_description,
            };
        }
        return {
            message: 'Invalid amount. Please enter a valid number greater than 0.',
        };
    }
    async awaitingDescription(chatId, sanitizedText, inProcessTransaction) {
        inProcessTransaction.description = sanitizedText;
        this.chatIdToUserStateMapping.set(chatId, {
            inProcessTransaction,
            status: UserStatus.awaiting_date,
        });
        return {
            message: `Please specify the date for the transaction (DD/MM/YYYY).
        select /now for the current date.`,
            nextStep: UserStatus.awaiting_date,
        };
    }
    async awaitingDate(chatId, sanitizedText, inProcessTransaction) {
        const date = ['now', 'today'].includes(sanitizedText)
            ? new Date()
            : new Date(sanitizedText);
        // Create the transaction and clear the state
        await transactionService_1.default.createTransaction({
            type: inProcessTransaction.type,
            value: inProcessTransaction.value,
            description: inProcessTransaction.description,
            categoryId: '1b5c146b-1d40-45ef-b6e3-0c6d98913456', // Placeholder for category id
            date,
        });
        this.chatIdToUserStateMapping.delete(chatId);
        return { message: 'Transaction created successfully.' };
    }
}
exports.transactionManager = new TransactionManager();
