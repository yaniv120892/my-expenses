import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './aiProvider';
import logger from '../../utils/logger';
import { Category } from '../../types/category';

export class GeminiService implements AIProvider {
  private gemini: GoogleGenerativeAI;
  private modelName: string = 'gemini-2.0-flash';

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  }

  async analyzeExpenses(
    expenseSummary: string,
    suffixPrompt?: string,
  ): Promise<string> {
    try {
      logger.debug(`Start analyzing expenses`);
      const model = this.gemini.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze my recent expenses:\n\n${expenseSummary}, all expenses are in NIS, response in hebrew, no more than 4 sentences, add new line after each sentence, ${suffixPrompt}`,
              },
            ],
          },
        ],
      });

      const analysis =
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      logger.debug(`Done analyzing expenses: ${analysis}`);

      return analysis || 'No expense analysis available.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'I encountered an issue analyzing your expenses.';
    }
  }

  async suggestCategory(
    expenseDescription: string,
    categoryOptions: Category[],
  ): Promise<string> {
    try {
      logger.debug(
        `Start suggesting category for expense: ${expenseDescription}`,
      );
      const model = this.gemini.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Which category does this expense belong to?\n\n"${expenseDescription}", here are the available options:\n${categoryOptions.map(
                  (category) =>
                    `- ${category.name}\n, return only the category name`,
                )}`,
              },
            ],
          },
        ],
      });

      const aiSuggestedCategory =
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text;

      const categoryId = categoryOptions.find(
        (category) => category.name === aiSuggestedCategory,
      )?.id;

      logger.debug(
        `Done suggesting category for expense: ${expenseDescription} - ${aiSuggestedCategory}`,
      );
      return categoryId || 'No category found.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'I encountered an issue suggesting a category.';
    }
  }
}
