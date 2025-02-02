import { CreateTransaction, TransactionType } from 'types/transaction';
import TransactionService from './transactionService';

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
  private chatIdToUserStateMapping: Map<number, UserState> = new Map();

  public async handleUserState(
    chatId: number,
    sanitizedText: string,
  ): Promise<{ message: string; nextStep: UserStatus }> {
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
        return this.awaitingDescription(
          chatId,
          sanitizedText,
          inProcessTransaction,
        );
      }
      case UserStatus.AWAITING_DATE: {
        return this.awaitingDate(chatId, sanitizedText, inProcessTransaction);
      }
      default: {
        return { message: 'Invalid state', nextStep: UserStatus.FAILURE };
      }
    }
  }

  public resetUserState(chatId: number) {
    this.chatIdToUserStateMapping.delete(chatId);
  }

  private async awaitingType(
    chatId: number,
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
    chatId: number,
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
    chatId: number,
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
    chatId: number,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
    const date = ['now', 'today'].includes(sanitizedText)
      ? new Date()
      : new Date(sanitizedText);

    // Create the transaction and clear the state
    await TransactionService.createTransaction({
      type: inProcessTransaction.type as TransactionType,
      value: inProcessTransaction.value as number,
      description: inProcessTransaction.description as string,
      categoryId: '1b5c146b-1d40-45ef-b6e3-0c6d98913456', // Placeholder for category id
      date,
    });

    this.chatIdToUserStateMapping.delete(chatId);
    return {
      message: 'Transaction created successfully.',
      nextStep: UserStatus.TRANSACTION_COMPLETE,
    };
  }
}

export const transactionManager = new TransactionManager();
