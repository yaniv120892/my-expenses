import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from 'services/ai/aiProvider';
import logger from 'utils/logger';

export class GeminiService implements AIProvider {
  private gemini: GoogleGenerativeAI;
  private modelName: string = 'gemini-pro'; // Use 'gemini-1.5-pro' if needed

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  }

  /** Analyzes user's expenses and provides insights */
  async analyzeExpenses(expenseSummary: string): Promise<string> {
    try {
      logger.debug(`Start analyzing expenses`);
      const model = this.gemini.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze my recent expenses:\n\n${expenseSummary}, all expenses are in NIS.`,
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

  /** Suggests a category for a given expense description */
  async suggestCategory(expenseDescription: string): Promise<string> {
    try {
      const model = this.gemini.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Which category does this expense belong to?\n\n"${expenseDescription}"`,
              },
            ],
          },
        ],
      });

      return (
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No category suggestion available.'
      );
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'I encountered an issue suggesting a category.';
    }
  }
}
