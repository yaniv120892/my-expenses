import { Transaction } from '../types/transaction';
import logger from '../utils/logger';

class GeminiProvider {
  public async findMatchingTransaction(
    importedDescription: string,
    potentialMatches: Transaction[],
  ): Promise<string | null> {
    try {
      const prompt = {
        context: `You are a helpful assistant that matches similar transaction descriptions. Your task is to find the most semantically similar transaction from a list of potential matches.

Rules:
1. Compare the imported description with each potential match
2. Consider semantic similarity, not just exact matches
3. Account for variations in merchant names and transaction descriptions
4. Return ONLY the ID of the best matching transaction
5. If no good match is found, return "none"
6. Do not explain your choice, just return the ID or "none"`,

        examples: [
          {
            input: {
              imported: 'WALMART STORE 1234',
              matches: [
                { id: 't1', description: 'Walmart Superstore' },
                { id: 't2', description: 'Target Shopping' },
              ],
            },
            output: 't1',
          },
          {
            input: {
              imported: 'STARBUCKS COFFEE #4321',
              matches: [
                { id: 't1', description: 'Grocery Store' },
                { id: 't2', description: 'Coffee Shop' },
              ],
            },
            output: 'none',
          },
        ],

        query: `Given this imported transaction description: "${importedDescription}"

Find the best matching transaction from this list:
${potentialMatches.map((t) => `- "${t.description}" (ID: ${t.id})`).join('\n')}

Return only the ID of the best match, or "none" if no good match exists.`,
      };

      // TODO: Replace with your actual Gemini API call
      // const response = await gemini.generateContent(prompt);
      // const result = response.text().trim();

      // Temporary implementation until you add your Gemini integration
      logger.warn('Gemini provider not implemented yet');
      return null;

      // return result === 'none' ? null : result;
    } catch (error) {
      logger.error('Error in Gemini provider:', error);
      return null;
    }
  }
}

export const geminiProvider = new GeminiProvider();
