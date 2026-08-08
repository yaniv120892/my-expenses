import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import logger from '../../utils/logger';

/**
 * Mastra manages its own tables, so it needs a direct Postgres connection.
 * DATABASE_URL runs through Prisma Accelerate (see src/prisma/client.ts) and is
 * a prisma:// URL that node-postgres cannot open — DIRECT_URL is the one to use.
 */
const connectionString =
  process.env.MASTRA_DB_URL || process.env.DIRECT_URL || '';

const MASTRA_SCHEMA = 'mastra';

/**
 * The shared Memory instance, or undefined when no direct connection is
 * configured. The assistant stays usable without memory rather than failing to
 * start, so a missing DIRECT_URL degrades to stateless chat.
 *
 * Built once at module load — the Postgres pool underneath is lazy, so this
 * does not open a connection at startup.
 */
const memory = connectionString
  ? new Memory({
      storage: new PostgresStore({
        id: 'assistant-memory',
        connectionString,
        // Keeps Mastra's self-managed tables out of `public` so they never
        // collide with the Prisma schema or show up as migration drift.
        schemaName: MASTRA_SCHEMA,
      }),
    })
  : undefined;

if (!connectionString) {
  logger.warn(
    'Assistant memory disabled: set MASTRA_DB_URL or DIRECT_URL to persist conversation threads',
  );
}

export function getAssistantMemory(): Memory | undefined {
  return memory;
}

/** Whether conversation history is persisted server-side. */
export function isMemoryEnabled(): boolean {
  return Boolean(connectionString);
}

/**
 * Threads are keyed per user so history is recalled across sessions and
 * devices. The resource id scopes every thread to its owner.
 */
export function getThreadId(userId: string): string {
  return `financial-assistant:${userId}`;
}
