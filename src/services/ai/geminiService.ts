import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from 'services/ai/aiProvider';

export class GeminiService implements AIProvider {
  private gemini: GoogleGenerativeAI;
  private modelName: string = 'gemini-pro'; // Use 'gemini-1.5-pro' if needed

  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  }

  /** Analyzes user's expenses and provides insights */
  async analyzeExpenses(expenseSummary: string): Promise<string> {
    try {
      const model = this.gemini.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `Analyze my recent expenses:\n\n${expenseSummary}` },
            ],
          },
        ],
      });

      return (
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No insights available.'
      );
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
