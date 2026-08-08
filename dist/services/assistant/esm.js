"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importEsm = importEsm;
/**
 * Loads an ES module from CommonJS without tsc turning it back into a require.
 *
 * Mastra is published as dual ESM/CJS. Its CommonJS build `require`s packages
 * that are ESM-only (`tokenx` ships no CJS build at all), which only works on a
 * runtime that supports `require(esm)`. Vercel's Node runtime does not — the
 * whole process dies at startup with ERR_REQUIRE_ESM, so every route 500s, not
 * just the assistant. Loading Mastra's ESM build instead sidesteps the issue for
 * every such dependency at once, present and future.
 *
 * A plain `await import(...)` would not survive compilation: this project emits
 * CommonJS (tsconfig `module: commonjs`), and tsc rewrites dynamic imports into
 * `require()` calls, which is exactly the thing being avoided. Going through
 * `new Function` keeps a genuine `import()` in the emitted JavaScript, so Node
 * resolves the package's "import" condition.
 */
const dynamicImport = new Function('specifier', 'return import(specifier)');
function importEsm(specifier) {
    return dynamicImport(specifier);
}
