"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssistantMemory = getAssistantMemory;
exports.isMemoryEnabled = isMemoryEnabled;
exports.getThreadId = getThreadId;
const logger_1 = __importDefault(require("../../utils/logger"));
const esm_1 = require("./esm");
/**
 * Mastra manages its own tables, so it needs a direct Postgres connection.
 * DATABASE_URL runs through Prisma Accelerate (see src/prisma/client.ts) and is
 * a prisma:// URL that node-postgres cannot open — DIRECT_URL is the one to use.
 */
const connectionString = process.env.MASTRA_DB_URL || process.env.DIRECT_URL || '';
const MASTRA_SCHEMA = 'mastra';
if (!connectionString) {
    logger_1.default.warn('Assistant memory disabled: set MASTRA_DB_URL or DIRECT_URL to persist conversation threads');
}
let memory;
/**
 * The shared Memory instance, or undefined when no direct connection is
 * configured. The assistant stays usable without memory rather than failing to
 * start, so a missing DIRECT_URL degrades to stateless chat.
 *
 * Built at most once and then reused — the Postgres pool underneath is lazy, so
 * constructing it does not open a connection.
 */
function getAssistantMemory() {
    if (!connectionString)
        return Promise.resolve(undefined);
    // Not cached when it rejects, so a failed build does not permanently
    // disable memory for the rest of the process's life.
    memory !== null && memory !== void 0 ? memory : (memory = build(connectionString).catch((error) => {
        memory = undefined;
        throw error;
    }));
    return memory;
}
async function build(url) {
    const [{ Memory }, { PostgresStore }] = await Promise.all([
        (0, esm_1.importEsm)('@mastra/memory'),
        (0, esm_1.importEsm)('@mastra/pg'),
    ]);
    return new Memory({
        storage: new PostgresStore({
            id: 'assistant-memory',
            connectionString: url,
            // Keeps Mastra's self-managed tables out of `public` so they never
            // collide with the Prisma schema or show up as migration drift.
            schemaName: MASTRA_SCHEMA,
        }),
    });
}
/** Whether conversation history is persisted server-side. */
function isMemoryEnabled() {
    return Boolean(connectionString);
}
/**
 * Threads are keyed per user so history is recalled across sessions and
 * devices. The resource id scopes every thread to its owner.
 */
function getThreadId(userId) {
    return `financial-assistant:${userId}`;
}
