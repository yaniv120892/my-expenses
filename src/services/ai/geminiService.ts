import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './aiProvider';
import logger from '../../utils/logger';
import { Category } from '../../types/category';
import { Transaction } from '../../types/transaction';

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
                text: `Analyze my recent expenses:\n\n${expenseSummary}, all expenses are in NIS, response in hebrew, no more than 2 sentences, add new line after each sentence, ${suffixPrompt}`,
              },
            ],
          },
        ],
      });

      const analysis = this.cleanGeminiResponse(
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text,
      );
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

      const aiSuggestedCategory = this.cleanGeminiResponse(
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text,
      );

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

  async findMatchingTransaction(
    importedDescription: string,
    potentialMatches: Transaction[],
  ): Promise<string | null> {
    try {
      logger.debug(
        `Start finding matching transaction for: ${importedDescription}`,
      );

      if (!potentialMatches.length) return null;

      const model = this.gemini.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a helpful assistant that matches similar transaction descriptions. Your task is to find the most semantically similar transaction from a list of potential matches.

Rules:
1. Compare the imported description with each potential match
2. Consider semantic similarity, not just exact matches
3. Account for variations in merchant names and transaction descriptions
4. Return ONLY the ID of the best matching transaction
5. If no good match is found, return "none"
6. Do not explain your choice, just return the ID or "none"

Given this imported transaction description: "${importedDescription}"

Find the best matching transaction from this list:
${potentialMatches.map((t) => `- "${t.description}" (ID: ${t.id})`).join('\n')}

Return only the ID of the best match, or "none" if no good match exists.`,
              },
            ],
          },
        ],
      });

      const result = this.cleanGeminiResponse(
        response.response?.candidates?.[0]?.content?.parts?.[0]?.text,
      );

      logger.debug(`Done finding matching transaction. Result: ${result}`);

      return result === 'none' ? null : result;
    } catch (error) {
      logger.error('Error finding matching transaction:', error);
      return null;
    }
  }

  private cleanGeminiResponse(response: string | undefined): string {
    if (!response) return '';
    return response
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\n+/g, '\n')
      .trim();
  }
}
