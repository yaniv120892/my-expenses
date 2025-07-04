import OpenAI from 'openai';
import { AIProvider } from 'services/ai/aiProvider';
import { Category } from 'types/category';
import { Transaction } from 'types/transaction';

export class ChatGPTService implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
      });

      return response.choices[0].message?.content || 'No insights available.';
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      return 'I encountered an issue generating content.';
    }
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

  async findMatchingTransaction(
    importedDescription: string,
    potentialMatches: Transaction[],
  ): Promise<string | null> {
    try {
      if (!potentialMatches.length) return null;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that matches similar transaction descriptions. Respond only with the ID of the best matching transaction or "none" if no good match is found.',
          },
          {
            role: 'user',
            content: `Given an imported transaction with description "${importedDescription}", find the best matching transaction from the following list based on semantic similarity:

${potentialMatches.map((t) => `- "${t.description}" (ID: ${t.id})`).join('\n')}

Return only the ID of the best matching transaction, or "none" if none of them match well.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      });

      const result = response.choices[0].message?.content?.trim();

      return result === 'none' ? null : result || null;
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      return null;
    }
  }
}
