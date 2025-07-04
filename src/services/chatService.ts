import AIServiceFactory from '../services/ai/aiServiceFactory';
import transactionRepository from '../repositories/transactionRepository';
import { Transaction } from '../types/transaction';
import { AIProvider } from '../services/ai/aiProvider';

class ChatService {
  private aiProvider: AIProvider;
  private transactionRepository: typeof transactionRepository;

  constructor() {
    this.aiProvider = AIServiceFactory.getAIService();
    this.transactionRepository = transactionRepository;
  }

  public async getChatResponse(message: string, userId: string): Promise<string> {

    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `
      You are a financial assistant chatbot. Your task is to understand the user's request about their transactions and respond in a helpful, conversational way.
      The current date is ${currentDate}. Please use this as a reference for any relative date queries (e.g., 'last week', 'yesterday').
      Analyze the following user message: "${message}" 

      Based on the message, determine the user's intent and extract relevant parameters. The primary intents are 'list_transactions' and 'get_transaction_summary'.

      Extract the following parameters if present:
      - category (e.g., 'groceries', 'rent')
      - startDate (in YYYY-MM-DD format)
      - endDate (in YYYY-MM-DD format)

      Your response should be a JSON object with the intent and parameters. For example:
      { "intent": "list_transactions", "parameters": { "category": "restaurants", "startDate": "2025-07-01", "endDate": "2025-07-04" } }
    `;

    try {
      const result = await this.aiProvider.generateContent(prompt);
      const parsedResult = JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));

      const { intent, parameters } = parsedResult;

      let transactions: Transaction[] | undefined;
      if (intent === 'list_transactions' || intent === 'get_transaction_summary') {
        transactions = await this.transactionRepository.getTransactions({
          userId,
          page: 1,
          perPage: 100,
          ...parameters,
        });
      } else {
        return "I'm sorry, I can only help with questions about your transactions. Please try asking something like, 'How much did I spend on groceries last week?'";
      }

      const finalPrompt = `
        You are a friendly financial assistant. The current date is ${currentDate}. The user asked: "${message}"
        You have retrieved the following transaction data: ${JSON.stringify(transactions, null, 2)}
        
        Based on this data, provide a clear and concise answer to the user's question.
      `;

      const finalResult = await this.aiProvider.generateContent(finalPrompt);
      return finalResult;
    } catch (error) {
      console.error('Error in ChatService:', error);
      return "I'm sorry, something went wrong while I was trying to understand that. Please try again.";
    }
  }
}

export default new ChatService();
