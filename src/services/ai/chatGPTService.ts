import OpenAI from 'openai';
import { AIProvider } from 'services/ai/aiProvider';
import { Category } from 'types/category';

export class ChatGPTService implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeExpenses(
    expenseSummary: string,
    suffixPrompt?: string,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial assistant helping users analyze their expenses.',
          },
          {
            role: 'user',
            content: `Analyze my recent expenses:\n\n${expenseSummary}, ${suffixPrompt}`,
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

  async suggestCategory(
    expenseDescription: string,
    categoryOptions: Category[],
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial assistant helping users categorize their expenses.',
          },
          {
            role: 'user',
            content: `Which category does this expense belong to?\n\n"${expenseDescription}", here are the available options:\n${categoryOptions.map(
              (category) =>
                `- ${category.name}\n, return only the category name`,
            )}`,
          },
        ],
        max_tokens: 50,
      });

      const aiSuggestedCategory = response.choices[0].message?.content;

      const suggestedCategory = categoryOptions.find(
        (category) => category.name === aiSuggestedCategory,
      );

      return suggestedCategory?.id || 'No category found.';
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      return 'I encountered an issue suggesting a category.';
    }
  }
}
