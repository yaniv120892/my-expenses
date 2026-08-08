"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMastra = loadMastra;
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
/**
 * Loads Mastra, as ESM, from CommonJS.
 *
 * Mastra's CommonJS build `require`s packages that are ESM-only (`tokenx` ships
 * no CommonJS build at all), which only works on a runtime that supports
 * `require(esm)`. Vercel's does not, and the failure is at module load, so the
 * whole process dies before the server starts — every route 500s, not just the
 * assistant. Loading Mastra's ESM build sidesteps that for every such
 * dependency at once.
 *
 * A plain `await import(...)` would not survive compilation: this project emits
 * CommonJS, and tsc rewrites dynamic imports into `require()` calls, which is
 * the exact thing being avoided. Going through `new Function` keeps a genuine
 * `import()` in the emitted JavaScript.
 */
const dynamicImport = new Function('specifier', 'return import(specifier)');
/**
 * Never executed — the environment variable is not set anywhere, and is not
 * meant to be. This exists purely to be read by Vercel's file tracer.
 *
 * Vercel decides what goes in the lambda by statically following
 * `import`/`require`, and it cannot see through the dynamic import above.
 * Without something static pointing at mastra.mjs, Mastra is absent from the
 * deployed bundle: the server boots fine and the first chat request fails with
 * ERR_MODULE_NOT_FOUND. That is exactly how this broke in production.
 *
 * Measured, not assumed: with this reference and no other, a real trace of dist
 * pulls in 496 Mastra files; with neither this nor the `__dirname` below, zero.
 * The `__dirname` in loadMastra happens to be sufficient on its own too — nft
 * emits the containing directory as an asset — but that is a heuristic of the
 * tracer, whereas this is an explicit statement of the dependency. Keeping both
 * costs nothing.
 *
 * What actually protects this is the trace assertion in test/e2e/run.ts, which
 * checks the outcome — that Mastra ships — rather than the mechanism.
 */
if (process.env.MASTRA_TRACE_ONLY === '1') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./mastra.mjs');
}
function loadMastra() {
    // An absolute file URL rather than './mastra.mjs': code inside `new Function`
    // has no module of its own, so a relative specifier would be resolved against
    // the process, not against this file.
    const entry = (0, url_1.pathToFileURL)(path_1.default.join(__dirname, 'mastra.mjs')).href;
    return dynamicImport(entry);
}
