import { CreateTransaction, TransactionType } from 'types/transaction';
import TransactionService from './transactionService';

enum UserStatus {
  awaiting_type = 'awaiting_type',
  awaiting_amount = 'awaiting_amount',
  awaiting_description = 'awaiting_description',
  awaiting_date = 'awaiting_date',
}

type UserState = {
  inProcessTransaction: Partial<CreateTransaction>;
  status: UserStatus;
};

class TransactionManager {
  private chatIdToUserStateMapping: Map<number, UserState> = new Map();

  public async handleUserState(chatId: number, sanitizedText: string) {
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
        return this.awaitingDescription(
          chatId,
          sanitizedText,
          inProcessTransaction,
        );
      }
      case UserStatus.awaiting_date: {
        return this.awaitingDate(chatId, sanitizedText, inProcessTransaction);
      }
      default: {
        return { message: 'Invalid state' };
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

  private async awaitingAmount(
    chatId: number,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
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

  private async awaitingDescription(
    chatId: number,
    sanitizedText: string,
    inProcessTransaction: Partial<CreateTransaction>,
  ) {
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
    return { message: 'Transaction created successfully.' };
  }
}

export const transactionManager = new TransactionManager();
