import { Category } from '../../types/category';
import { Transaction } from '../../types/transaction';

export interface AIProvider {
  analyzeExpenses(
    expenseSummary: string,
    suffixPrompt?: string,
  ): Promise<string>;
  suggestCategory(
    expenseDescription: string,
    categoryOptions: Category[],
  ): Promise<string>;
  findMatchingTransaction(
    importedDescription: string,
    potentialMatches: Transaction[],
  ): Promise<string | null>;
}
