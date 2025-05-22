import { CreateTransaction, TransactionType } from '../types/transaction';
import TransactionService from './transactionService';
import logger from '../utils/logger';
import { formatTransaction } from '../utils/transactionUtils';

//TODO: implement logic to get userId from chatId
const userId = 'dummy-user-id';

export enum UserStatus {
  AWAITING_TYPE = 'AWAITING_TYPE',
  AWAITING_AMOUNT = 'AWAITING_AMOUNT',
  AWAITING_DESCRIPTION = 'AWAITING_DESCRIPTION',
  AWAITING_DATE = 'AWAITING_DATE',
  TRANSACTION_COMPLETE = 'TRANSACTION_COMPLETE',
  FAILURE = 'FAILURE',
}

type UserState = {
  inProcessTransaction: Partial<CreateTransaction>;
  status: UserStatus;
};

class TransactionManager {
  private chatIdToUserStateMapping: Map<string, UserState> = new Map();

  public async handleUserState(
    chatId: string,
    text: string,
  ): Promise<{ message: string; nextStep: UserStatus }> {
    logger.debug(`Handling user state for chatId: ${chatId}`, {
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
        response = await this.awaitingType(
          chatId,
          sanitizedText,
          inProcessTransaction,
        );
        break;
      }
      case UserStatus.AWAITING_AMOUNT: {
        response = await this.awaitingAmount(
          chatId,
          sanitizedText,
          inProcessTransaction,
        );
        break;
      }
      case UserStatus.AWAITING_DESCRIPTION: {
        response = await this.awaitingDescription(
          chatId,
          sanitizedText,
          inProcessTransaction,
        );
        break;
      }
      case UserStatus.AWAITING_DATE: {
        response = await this.awaitingDate(
          chatId,
          sanitizedText,
          inProcessTransaction,
        );
        break;
      }
      default: {
        response = { message: 'Invalid state', nextStep: UserStatus.FAILURE };
        break;
      }
    }

    logger.debug(`User state handled for chatId: ${chatId}`);
    return response;
  }

  public resetUserState(chatId: string) {
    this.chatIdToUserStateMapping.delete(chatId);
  }

  private async awaitingType(
    chatId: string,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
    if (sanitizedText === 'expense' || sanitizedText === 'income') {
      inProcessTransaction.type =
        sanitizedText.toUpperCase() as TransactionType;
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

  private async awaitingAmount(
    chatId: string,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
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

  private async awaitingDescription(
    chatId: string,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
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

  private async awaitingDate(
    chatId: string,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
    const date = ['now', 'today'].includes(sanitizedText)
      ? new Date()
      : new Date(sanitizedText);

    const createdTransaction = await TransactionService.createTransaction({
      type: inProcessTransaction.type as TransactionType,
      value: inProcessTransaction.value as number,
      description: inProcessTransaction.description as string,
      categoryId: null,
      date,
      userId,
    });

    const transaction = await TransactionService.getTransactionItem(
      createdTransaction,
      userId,
    );

    if (!transaction) {
      return {
        message: 'Transaction created, but failed to retrieve details.',
        nextStep: UserStatus.TRANSACTION_COMPLETE,
      };
    }

    const transactionMessage = `✅ *Transaction Created Successfully!* ✅
    📉 ${formatTransaction(transaction)}`;

    this.chatIdToUserStateMapping.delete(chatId);
    return {
      message: transactionMessage,
      nextStep: UserStatus.TRANSACTION_COMPLETE,
    };
  }
}

export const transactionManager = new TransactionManager();
