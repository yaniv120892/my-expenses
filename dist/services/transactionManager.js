"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionManager = exports.UserStatus = void 0;
const transactionService_1 = __importDefault(require("./transactionService"));
const logger_1 = __importDefault(require("../utils/logger"));
const transactionUtils_1 = require("../utils/transactionUtils");
//TODO: implement logic to get userId from chatId
const userId = 'dummy-user-id';
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
    async handleUserState(chatId, text) {
        logger_1.default.debug(`Handling user state for chatId: ${chatId}`, {
            text,
        });
        const sanitizedText = text.replace('/', '').trim().toLowerCase();
        const currentState = this.chatIdToUserStateMapping.get(chatId);
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
        let response;
        switch (status) {
            case UserStatus.AWAITING_TYPE: {
                response = await this.awaitingType(chatId, sanitizedText, inProcessTransaction);
                break;
            }
            case UserStatus.AWAITING_AMOUNT: {
                response = await this.awaitingAmount(chatId, sanitizedText, inProcessTransaction);
                break;
            }
            case UserStatus.AWAITING_DESCRIPTION: {
                response = await this.awaitingDescription(chatId, sanitizedText, inProcessTransaction);
                break;
            }
            case UserStatus.AWAITING_DATE: {
                response = await this.awaitingDate(chatId, sanitizedText, inProcessTransaction);
                break;
            }
            default: {
                response = { message: 'Invalid state', nextStep: UserStatus.FAILURE };
                break;
            }
        }
        logger_1.default.debug(`User state handled for chatId: ${chatId}`);
        return response;
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
        const createdTransaction = await transactionService_1.default.createTransaction({
            type: inProcessTransaction.type,
            value: inProcessTransaction.value,
            description: inProcessTransaction.description,
            categoryId: null,
            date,
            userId,
        });
        const transaction = await transactionService_1.default.getTransactionItem(createdTransaction, userId);
        if (!transaction) {
            return {
                message: 'Transaction created, but failed to retrieve details.',
                nextStep: UserStatus.TRANSACTION_COMPLETE,
            };
        }
        const transactionMessage = `✅ *Transaction Created Successfully!* ✅
    📉 ${(0, transactionUtils_1.formatTransaction)(transaction)}`;
        this.chatIdToUserStateMapping.delete(chatId);
        return {
            message: transactionMessage,
            nextStep: UserStatus.TRANSACTION_COMPLETE,
        };
    }
}
exports.transactionManager = new TransactionManager();
