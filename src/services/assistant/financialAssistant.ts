import type { Agent } from '@mastra/core/agent';
import { getAssistantModel } from './model';
import { getAssistantMemory } from './memory';
import { buildAssistantTools } from './tools';
import { loadMastra } from './esm';

function buildInstructions(): string {
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

let assistant: Promise<Agent> | undefined;

/**
 * The shared agent, constructed on first use and reused afterwards.
 *
 * Async because Mastra is reached through a dynamic import (see ./esm), which
 * also means nothing Mastra-related is loaded until someone actually chats —
 * routes that never touch the assistant pay nothing for it.
 */
export function getFinancialAssistant(): Promise<Agent> {
  // A rejected promise is dropped rather than cached, so one failed build does
  // not disable chat for the lifetime of the process.
  assistant ??= build().catch((error) => {
    assistant = undefined;
    throw error;
  });

  return assistant;
}

async function build(): Promise<Agent> {
  const [{ Agent }, tools, memory] = await Promise.all([
    loadMastra(),
    buildAssistantTools(),
    getAssistantMemory(),
  ]);

  return new Agent({
    id: 'financial-assistant',
    name: 'Financial Assistant',
    // Passed as a function so the current date is resolved per request rather
    // than frozen when the agent is first built.
    instructions: buildInstructions,
    model: getAssistantModel,
    tools,
    // Omitted entirely when no direct Postgres connection is configured, so the
    // assistant still answers (statelessly) instead of failing to construct.
    ...(memory ? { memory } : {}),
  });
}
