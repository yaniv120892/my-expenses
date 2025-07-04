"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiServiceFactory_1 = __importDefault(require("../services/ai/aiServiceFactory"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
class ChatService {
    constructor() {
        this.aiProvider = aiServiceFactory_1.default.getAIService();
        this.transactionRepository = transactionRepository_1.default;
    }
    async getChatResponse(message, userId) {
        const prompt = `
      You are a financial assistant chatbot. Your task is to understand the user's request about their transactions and respond in a helpful, conversational way.
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
            let transactions;
            if (intent === 'list_transactions' || intent === 'get_transaction_summary') {
                transactions = await this.transactionRepository.getTransactions(Object.assign({ userId, page: 1, perPage: 100 }, parameters));
            }
            else {
                return "I'm sorry, I can only help with questions about your transactions. Please try asking something like, 'How much did I spend on groceries last week?'";
            }
            const finalPrompt = `
        You are a friendly financial assistant. The user asked: "${message}"
        You have retrieved the following transaction data: ${JSON.stringify(transactions, null, 2)}
        
        Based on this data, provide a clear and concise answer to the user's question.
      `;
            const finalResult = await this.aiProvider.generateContent(finalPrompt);
            return finalResult;
        }
        catch (error) {
            console.error('Error in ChatService:', error);
            return "I'm sorry, something went wrong while I was trying to understand that. Please try again.";
        }
    }
}
exports.default = new ChatService();
