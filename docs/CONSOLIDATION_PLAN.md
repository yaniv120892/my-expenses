# My Expenses — Consolidation into `my-expenses-app` (single Next.js app)

## Context

The app is split across 3 repos / 3 Vercel deployments: `my-expenses` (Express API + Prisma), `my-expenses-website` (Next.js 15 + MUI frontend), `my-expenses-agent` (Gemini-based Excel statement-extraction microservice — not a general agent; the chat AI lives in the backend's `chatService.ts`). The backend's deploy model is fragile (compiled `dist/` committed to git, built by a pre-commit hook, served directly by Vercel), there are no tests and no CI anywhere, and the frontend has 3 competing styling systems and hash-based tabs.

Goal: one new repo `yaniv120892/my-expenses-app`, one Vercel project, one URL — all TypeScript, all existing features, a new mobile-first dark fintech UI, chat upgraded to a tool-calling agent with read AND write operations, plus guardrails (CLAUDE.md, CI, automated review) to move fast safely.

## Confirmed decisions
- **Single Next.js 15 full-stack app** (App Router): UI + API route handlers + Vercel cron. No turborepo — one package, one lockfile.
- New repo `my-expenses-app`; the 3 old repos stay untouched until cutover, then archived.
- **UI**: shadcn/ui + Tailwind v4, dark-first fintech (light mode too), real routes, sidebar (desktop) + bottom nav (mobile). MUI removed. Keep recharts, React Query v5 (query-key factories), react-hook-form.
- **Agent LLM**: keep current provider abstraction (`AI_PROVIDER`: gemini | chatgpt) — extend it with function calling.
- **Vercel**: design for Hobby limits (2 daily crons via a dispatcher; conservative maxDuration) — works on Pro too.
- **DB**: reuse the existing Postgres/Accelerate DB — copy `schema.prisma` + all migration folders verbatim. **No data migration.** Keep `PRISMA_FIELD_ENCRYPTION_KEY` and `JWT_SECRET` values identical.

## Target structure

```
my-expenses-app/
├── CLAUDE.md  .github/workflows/{ci.yml, claude-review.yml, e2e.yml}  .husky/
├── prisma/{schema.prisma, migrations/}      # copied verbatim from my-expenses/src/prisma
├── e2e/                                     # Playwright smoke tests
└── src/
    ├── middleware.ts                        # cookie presence check → /login redirect
    ├── app/
    │   ├── (auth)/{login,signup,verify}/
    │   ├── (app)/{dashboard,transactions,pending,scheduled,subscriptions,imports,trends,settings}/
    │   └── api/                             # SAME REST paths as the Express API
    │       ├── auth/* transactions/* categories/ scheduled-transactions/ imports/*
    │       ├── dashboard/ trends/ subscriptions/ user/settings/ chat/
    │       ├── extraction/status/[id]/      # folded-in extraction job polling
    │       ├── cron/{daily,summary}/        # CRON_SECRET-protected
    │       └── webhook/telegram/            # secret_token-validated
    ├── server/                              # ported backend, near-verbatim
    │   ├── db/prisma.ts                     # singleton + Accelerate + field-encryption
    │   ├── auth/{session.ts,withAuth.ts,withCron.ts}  env.ts (zod-validated)
    │   ├── services/ repositories/ clients/ utils/    # ported wholesale
    │   ├── ai/{aiProvider,geminiService,chatGPTService,aiServiceFactory}
    │   ├── agent/{loop.ts, registry.ts, tools/}       # NEW tool-calling agent
    │   ├── extraction/                      # ported my-expenses-agent pipeline
    │   └── validators/                      # zod (replaces class-validator)
    ├── components/{ui/, app-shell/, per-feature/}
    └── hooks/ services/ lib/                # ported React Query layer
```

Aliases `@/*` → `src/*`, `@server/*` → `src/server/*` (mechanical rewrite of the backend's `baseUrl: src` bare imports). `import 'server-only'` + ESLint boundary rule keep server code out of client bundles.

## Key design points

**Porting pattern** (template: transactions): Express edge → thin route handlers + two wrappers. `withAuth` reads the `session` httpOnly cookie (Bearer header kept as fallback), verifies JWT + Upstash Redis session (same 401 error codes as today), maps domain errors. Controllers dissolve; `src/services`, `src/repositories`, `src/clients`, `src/utils` port with 3 systematic edits: import paths, Prisma singleton import, env reads centralized into zod-validated `src/server/env.ts`. Request DTOs become zod schemas (class-validator's decorator/reflect-metadata pattern fights Next's bundler). REST paths unchanged so the ported React Query service layer keeps working. Reference files: `my-expenses/src/routers/transactionRouter.ts`, `src/middlewares/authMiddleware.ts`.

**Auth**: same JWT + Redis session model, moved from localStorage to an httpOnly `Secure; SameSite=Lax` cookie (same-origin makes this free). Axios shrinks to `baseURL: '/api'` + 401 redirect. One-time re-login for users at cutover.

**Extraction fold-in**: port `excelAgent.ts` (4-step Gemini chain), `fileService`, Redis job store into `src/server/extraction/`. Delete the HTTP hop + HMAC webhook: import-process route enqueues via `after()`/`waitUntil`, pipeline calls the (ported) webhook-controller result-handling logic directly in-process. Keep Redis job state for the imports screen's status polling. Fixes the current unauthenticated `/api/extract` surface for free.

**Tool-calling agent** (replaces `chatService.ts` intent-JSON parsing; `chatAggregationService.ts` is reused as a tool): extend `AIProvider` with `generateWithTools()` (Gemini functionDeclarations / OpenAI tools; zod → JSON schema, kept flat for Gemini compatibility). Registry of tools with `mode: 'read' | 'write'`:
- Read (auto-execute, loop max 6 iterations): `search_transactions`, `aggregate_transactions`, `get_summary`, `list_categories`, `list_scheduled_transactions`, `list_subscriptions`, `get_pending_transactions`.
- Write (**never executed in the chat request**): `create/update/delete_transaction`, `update_transaction_status`, `create/update/delete_scheduled_transaction`, `create_category` — the loop returns a typed `proposedAction`; the chat UI renders a confirmation card; Confirm calls the normal REST endpoint (single write path, standard React Query invalidation). No streaming in v1.

**Cron** (Hobby-safe, exactly 2): `/api/cron/daily` dispatcher (scheduled-transaction processing + subscription detect + audit-notify + backup — wires up the currently-unwired jobs) and `/api/cron/summary` at 21:00. Both check `Authorization: Bearer ${CRON_SECRET}` — fixes today's public cron endpoints.

**UI**: Tailwind v4 `@theme` tokens (dark-first near-black surfaces, one accent, semantic income/expense colors, `next-themes` for light mode). Old tabs map 1:1 to routes. Chat becomes a docked drawer (desktop) / sheet (mobile) instead of FAB-only. shadcn: button, card, input, select, dialog, sheet, table, tabs, badge, skeleton, sonner, form, date-picker, command, switch. Drop dayjs (keep date-fns) and react-icons (use lucide).

**Guardrails**:
- `CLAUDE.md`: project map + layering rules (route → zod → service → repository; no Prisma outside repositories; no server imports in client code), "REST paths are contract", env only via `env.ts`, migration policy, agent write-confirmation invariant, commands, testing conventions.
- `ci.yml` (PR + main): npm ci → prisma generate/validate → tsc --noEmit → eslint → vitest → next build. `claude-review.yml`: `anthropics/claude-code-action` automated PR review. `e2e.yml`: Playwright against local Postgres service container (also proves migrations replay cleanly).
- Husky pre-commit: lint-staged + typecheck (no dist committing ever again). Branch protection on `main`, Vercel preview deploys per PR, prod build = `prisma generate && prisma migrate deploy && next build`.
- Vitest priorities: authService, transactionService, chatAggregationService, importService state machine, agent loop (write→proposal invariant), extraction pipeline with fixture xlsx.

**Env vars**: all backend values carry over unchanged (DB/Accelerate, encryption key, JWT, Upstash, AI keys, SMTP, Telegram, 3 S3 sets, Logtail, `EXPENSE_CATEGORIZER_BASE_URL` — FastText stays external). Dropped: `EXCEL_EXTRACTION_AGENT_URL` + webhook secret, agent repo `FILE_SERVICE_*`, `NEXT_PUBLIC_API_BASE_URL`. Added: `CRON_SECRET`, `TELEGRAM_WEBHOOK_SECRET`; `WEBSITE_URL` → `APP_URL`.

## Phases (each ends in a reviewable deployed preview; old deployments stay live until cutover)

- **Phase 0 — Scaffold + guardrails**: repo, Next 15 + TS strict + Tailwind + shadcn, env.ts, Prisma copied + singleton (verify Accelerate + field-encryption under Next bundling early; `serverExternalPackages` if needed), CLAUDE.md, CI, husky, Vercel project (preview only), `.env.example`.
- **Phase 1 — Backend port**: wrappers, all services/repositories/clients, zod validators, all REST routes (transactions first as template), cron dispatcher, Telegram webhook, vitest suite. Milestone: endpoint parity checklist old-vs-new (reads against prod DB, writes against a dev DB branch).
- **Phase 2 — Shell + auth + core screens**: tokens, app shell, login/signup/verify (cookie), Dashboard, Transactions (+attachments), Pending.
- **Phase 3 — Remaining screens**: Scheduled, Subscriptions, Imports (upload/review/batch/auto-approve rules), Trends, Settings, mobile QA, Playwright smoke.
- **Phase 4 — Agent upgrade**: `generateWithTools` both providers, registry + read tools, new chat panel, write tools + confirmation cards.
- **Phase 5 — Extraction fold-in**: port pipeline, rewire importService, `after()` background exec, delete webhook path, maxDuration tuning, fixture tests.
- **Phase 6 — Cutover**: set prod env vars → **disable old backend crons first** (avoid double scheduled-transaction processing) → promote + move domain → Telegram `setWebhook` to new URL with secret_token → verify login/screens/import/chat-write/cron/Telegram/attachments → keep old backend cron-less 1–2 weeks as rollback.
- **Phase 7 — Cleanup**: archive 3 old repos with pointer READMEs, delete old Vercel projects, drop Bearer fallback if unused.

## Verification
- CI green from Phase 0 onward; vitest during Phase 1 porting; endpoint parity script old-vs-new; Playwright smoke (login → add transaction → dashboard → import upload → chat read+confirmed write); mobile viewport QA via Playwright device profiles + screenshots for user review; fixture-xlsx extraction test; post-cutover checklist above.

## Risks
- Shared prod DB during transition (writes tested on a dev DB branch; schema unchanged so no destructive migrations pre-cutover).
- Double cron execution if old crons aren't disabled first (explicit checklist step).
- prisma-field-encryption/Accelerate under Next bundling — verified in Phase 0.
- Gemini function-calling JSON-schema quirks — keep tool schemas flat; test both providers.
- Vercel Hobby maxDuration limits for extraction — pipeline already chunked per-step; confirm plan tier during Phase 0.

## Needs from the user (during execution)
- Create/authorize the Vercel project for `my-expenses-app` and paste env vars (I'll generate the exact `.env` checklist) — or provide a Vercel token so I can configure it.
- An `ANTHROPIC_API_KEY` GitHub secret if the automated `claude-review.yml` PR review is wanted.
- Confirm Vercel plan tier (Hobby assumed) when we tune `maxDuration` in Phase 5.

## Immediate next steps on approval
1. Create `yaniv120892/my-expenses-app` (GitHub MCP) and Phase 0 scaffold.
2. Also commit this plan doc to `claude/monorepo-consolidation-plan-frltqy` on `my-expenses` for tracking, per branch instructions.
