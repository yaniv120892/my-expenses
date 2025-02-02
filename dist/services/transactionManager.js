"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionManager = exports.UserStatus = void 0;
const transactionService_1 = __importDefault(require("./transactionService"));
var UserStatus;
(function (UserStatus) {
    UserStatus["AWAITING_TYPE"] = "AWAITING_TYPE";
    UserStatus["AWAITING_AMOUNT"] = "AWAITING_AMOUNT";
    UserStatus["AWAITING_DESCRIPTION"] = "AWAITING_DESCRIPTION";
    UserStatus["AWAITING_DATE"] = "AWAITING_DATE";
    UserStatus["TRANSACTION_COMPLETE"] = "TRANSACTION_COMPLETE";
    UserStatus["FAILURE"] = "FAILURE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
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
                status: UserStatus.AWAITING_TYPE,
            });
            return {
                message: `Please select the transaction type
          1. /expense - to record an expense.
          2. /income - to record an income.`,
                nextStep: UserStatus.AWAITING_TYPE,
            };
        }
        const { inProcessTransaction, status } = currentState;
        switch (status) {
            case UserStatus.AWAITING_TYPE: {
                return this.awaitingType(chatId, sanitizedText, inProcessTransaction);
            }
            case UserStatus.AWAITING_AMOUNT: {
                return this.awaitingAmount(chatId, sanitizedText, inProcessTransaction);
            }
            case UserStatus.AWAITING_DESCRIPTION: {
                return this.awaitingDescription(chatId, sanitizedText, inProcessTransaction);
            }
            case UserStatus.AWAITING_DATE: {
                return this.awaitingDate(chatId, sanitizedText, inProcessTransaction);
            }
            default: {
                return { message: 'Invalid state', nextStep: UserStatus.FAILURE };
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
                status: UserStatus.AWAITING_AMOUNT,
            });
            return {
                message: 'Enter a valid number greater than 0.',
                nextStep: UserStatus.AWAITING_AMOUNT,
            };
        }
        return {
            message: `Invalid transaction type.
      Please select the transaction type
        1. /expense - to record an expense.
        2. /income - to record an income.`,
            nextStep: UserStatus.AWAITING_TYPE,
        };
    }
    async awaitingAmount(chatId, sanitizedText, inProcessTransaction) {
        if (!isNaN(Number(sanitizedText)) && Number(sanitizedText) > 0) {
            inProcessTransaction.value = Number(sanitizedText);
            this.chatIdToUserStateMapping.set(chatId, {
                inProcessTransaction,
                status: UserStatus.AWAITING_DESCRIPTION,
            });
            return {
                message: 'Enter the description:',
                nextStep: UserStatus.AWAITING_DESCRIPTION,
            };
        }
        return {
            message: `Invalid amount. 
      Enter a valid number greater than 0.`,
            nextStep: UserStatus.AWAITING_AMOUNT,
        };
    }
    async awaitingDescription(chatId, sanitizedText, inProcessTransaction) {
        inProcessTransaction.description = sanitizedText;
        this.chatIdToUserStateMapping.set(chatId, {
            inProcessTransaction,
            status: UserStatus.AWAITING_DATE,
        });
        return {
            message: `Please specify the date for the transaction (DD/MM/YYYY).
        select /now for the current date.`,
            nextStep: UserStatus.AWAITING_DATE,
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
            categoryId: null,
            date,
        });
        this.chatIdToUserStateMapping.delete(chatId);
        return {
            message: 'Transaction created successfully.',
            nextStep: UserStatus.TRANSACTION_COMPLETE,
        };
    }
}
exports.transactionManager = new TransactionManager();
