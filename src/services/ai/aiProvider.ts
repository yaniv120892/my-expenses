import { Category } from '../../types/category';

export interface AIProvider {
  analyzeExpenses(
    expenseSummary: string,
    suffixPrompt?: string,
  ): Promise<string>;
  suggestCategory(
    expenseDescription: string,
    categoryOptions: Category[],
  ): Promise<string>;
}
