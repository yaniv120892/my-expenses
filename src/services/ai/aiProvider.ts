export interface AIProvider {
  analyzeExpenses(expenseSummary: string): Promise<string>;
  suggestCategory(expenseDescription: string): Promise<string>;
}
