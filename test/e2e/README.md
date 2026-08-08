# End-to-end tests for the financial assistant

Runs the real API against a real Postgres, with the language model replaced by
a local mock. No API key required.

## Why a mock model

The mock proves the **plumbing**: that the agent is offered the right tools,
that a tool actually executes, that the numbers the user sees came out of
`chatAggregationService` rather than the model, and that the reply streams.

It does **not** prove prompt quality — whether a real model picks
`comparePeriods` for *"how much more did I spend in February"* still needs a
real key and a manual check. Keep that distinction in mind before treating a
green run as full coverage.

## Running

```bash
# 1. A local Postgres that speaks both protocols the app needs
npx prisma dev -d -n e2e -p 51213 -P 51214 --shadow-db-port 51215
npx prisma dev ls          # copy the DATABASE_URL and TCP urls

# 2. Point the env at it (see "Environment" below), then
npx prisma migrate deploy

# 3. Start the API with the mock model endpoint
ASSISTANT_MODEL_URL=http://127.0.0.1:51231/v1 npx ts-node src/index.ts

# 4. Run the checks
npx ts-node test/e2e/run.ts
```

`prisma dev` rather than the `docker-compose.yaml` Postgres: `src/prisma/client.ts`
imports `PrismaClient` from `@prisma/client/edge`, which speaks the Accelerate
protocol and cannot open a plain `postgresql://` URL. `prisma dev` provides both
— a `prisma+postgres://` endpoint for the app and a raw Postgres port for
migrations and Mastra storage — which is the same split as production.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `prisma+postgres://…` from `prisma dev` — the app's Accelerate connection |
| `DIRECT_URL` | Raw `postgres://…` — migrations, Mastra storage, and the seed |
| `MASTRA_DB_URL` | Same as `DIRECT_URL` |
| `ASSISTANT_MODEL_URL` | Base URL of the mock, e.g. `http://127.0.0.1:51231/v1` |
| `REDIS_URL` / `REDIS_TOKEN` | Point at the Upstash shim (`http://127.0.0.1:51230`) |
| `JWT_SECRET` | Must match what the seed signs tokens with |
| `PRISMA_FIELD_ENCRYPTION_KEY` | Required — the schema has one `@encrypted` field |

Three things are needed only to get the process to boot, and are never used by
the chat path. Several modules construct external clients at **import time**, so
missing values throw before `main` runs:

- `OPENAI_API_KEY` — any placeholder. `ChatGPTService` builds the OpenAI SDK at
  module load, and `transactionService` imports it.
- `EXCEL_EXTRACTION_AGENT_URL` and `EXCEL_EXTRACTION_AGENT_WEBHOOK_SECRET` — any
  placeholder, for the same reason via `importService`.
- **Leave `TELEGRAM_BOT_TOKEN` unset.** With it set, startup registers a webhook
  against `api.telegram.org`; where that host is unreachable the socket error
  arrives asynchronously and kills the process. `src/index.ts` skips
  registration when the token is absent.

## Pieces

- **`mockModelServer.ts`** — OpenAI-compatible `/v1/chat/completions` over SSE.
  Records every request, the tools it was offered, the tool calls it asked for,
  and the tool results it received, so tests can assert on the agent's actual
  behaviour. Echoes tool output verbatim in timed chunks, which is what lets a
  test prove both provenance and incremental delivery.
- **`upstashShim.ts`** — `@upstash/redis` speaks HTTP/REST, so a local
  redis-server is no use. Implements the handful of commands `redisProvider`
  issues.
- **`seed.ts`** — two users. User A's figures are chosen so the expected output
  is exact (Jan ₪4,100 vs Feb ₪5,200 → +₪1,100.00, +26.83%). User B exists only
  so a test can assert A's answers never contain B's numbers.
- **`run.ts`** — the assertions.

## Browser test

Incremental rendering is verified separately, in the website repo, at
`e2e/chat.spec.ts`. Asserting on the finished message would pass against a
non-streaming implementation too, so that test samples the message bubble while
the response is still open and requires it to grow.
