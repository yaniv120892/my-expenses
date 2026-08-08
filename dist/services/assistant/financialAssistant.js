"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialAssistant = getFinancialAssistant;
const model_1 = require("./model");
const memory_1 = require("./memory");
const tools_1 = require("./tools");
const esm_1 = require("./esm");
function buildInstructions() {
    const currentDate = new Date().toISOString().split('T')[0];
    return `
You are a friendly financial assistant for a personal expense tracking app.
You help the user understand their own transactions.

Today's date is ${currentDate}. Use it to resolve relative dates such as
"last week", "yesterday", or "this month" into concrete YYYY-MM-DD ranges.

## Using tools

- Call listCategories before filtering by category, so you use a real category
  name instead of guessing one.
- Use listTransactions when the user wants to see individual transactions.
- Use summarizeTransactions when the user wants a figure — a total, average,
  count, breakdown, or highest/lowest.
- Use comparePeriods for any comparison between two time ranges.
- Use getSpendingTrends for questions about how spending has moved over time.

## Numbers

Every figure you report must come from a tool result. Never compute a number
yourself — not a sum, a difference, a percentage, or an average — even when it
looks like simple arithmetic.

If the user asks for a figure you do not have, call another tool to get it.
comparePeriods already returns the difference and the percentage change, and a
category breakdown already returns each category's share, so you never need to
subtract or divide. If no tool can produce the figure, say what you can show
instead of working it out yourself.

Use the numbers from tool results exactly as returned, including their currency
formatting. Amounts are in Israeli Shekels (₪).

## Style

Answer conversationally and concisely. You may answer general personal-finance
questions that are not about the user's data, but keep them brief and do not
give regulated financial, tax, or investment advice.
`.trim();
}
let assistant;
/**
 * The shared agent, constructed on first use and reused afterwards.
 *
 * Async because Mastra is reached through a dynamic import (see ./esm), which
 * also means nothing Mastra-related is loaded until someone actually chats —
 * routes that never touch the assistant pay nothing for it.
 */
function getFinancialAssistant() {
    // A rejected promise is dropped rather than cached, so one failed build does
    // not disable chat for the lifetime of the process.
    assistant !== null && assistant !== void 0 ? assistant : (assistant = build().catch((error) => {
        assistant = undefined;
        throw error;
    }));
    return assistant;
}
async function build() {
    const [{ Agent }, tools, memory] = await Promise.all([
        (0, esm_1.loadMastra)(),
        (0, tools_1.buildAssistantTools)(),
        (0, memory_1.getAssistantMemory)(),
    ]);
    return new Agent(Object.assign({ id: 'financial-assistant', name: 'Financial Assistant', 
        // Passed as a function so the current date is resolved per request rather
        // than frozen when the agent is first built.
        instructions: buildInstructions, model: model_1.getAssistantModel, tools }, (memory ? { memory } : {})));
}
