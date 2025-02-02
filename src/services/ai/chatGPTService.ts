import OpenAI from 'openai';
import { AIProvider } from 'services/ai/aiProvider';

export class ChatGPTService implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /** Analyzes user's expenses and provides insights */
  async analyzeExpenses(expenseSummary: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo', // Ensure you use a model you have access to
        messages: [
          {
            role: 'system',
            content:
              'You are a financial assistant helping users analyze their expenses.',
          },
          {
            role: 'user',
            content: `Analyze my recent expenses:\n\n${expenseSummary}`,
          },
        ],
        max_tokens: 200,
      });

      return response.choices[0].message?.content || 'No insights available.';
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      return 'I encountered an issue analyzing your expenses.';
    }
  }

  /** Suggests a category for a given expense description */
  async suggestCategory(expenseDescription: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You classify expenses into categories like Food, Travel, Rent, Entertainment, Shopping, Healthcare, Utilities, Transportation, Miscellaneous.',
          },
          {
            role: 'user',
            content: `Which category does this expense belong to?\n\n"${expenseDescription}"`,
          },
        ],
        max_tokens: 50,
      });

      return (
        response.choices[0].message?.content ||
        'No category suggestion available.'
      );
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      return 'I encountered an issue suggesting a category.';
    }
  }
}
