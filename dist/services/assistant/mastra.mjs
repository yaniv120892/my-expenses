// The single entry point to Mastra, and deliberately a hand-written .mjs.
//
// Two constraints meet here:
//
//   1. Mastra's CommonJS build `require`s ESM-only packages, which Vercel's
//      Node runtime cannot do. So Mastra must be loaded as ESM.
//   2. Vercel's file tracer decides what to put in the lambda by reading static
//      `import`/`require` statements. It cannot see through the dynamic import
//      that requirement 1 forces, so anything reached only that way is left out
//      of the bundle and fails at runtime with ERR_MODULE_NOT_FOUND.
//
// A real .mjs file with static re-exports satisfies both: the runtime gets
// Mastra's ESM build, and the tracer gets something it can follow. tsc does not
// compile .mjs, so the build copies this file into dist verbatim.
//
// Anything new from Mastra should be re-exported here rather than imported
// directly somewhere else.

export { Agent } from '@mastra/core/agent';
export { createTool } from '@mastra/core/tools';
export { RequestContext } from '@mastra/core/request-context';
export { Memory } from '@mastra/memory';
export { PostgresStore } from '@mastra/pg';
