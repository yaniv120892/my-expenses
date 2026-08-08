import http from 'http';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Client } from 'pg';
import { startUpstashShim, seedKey } from './upstashShim';
import {
  startMockModelServer,
  getRecording,
  resetRecording,
} from './mockModelServer';
import { seed, SeedResult, USER_B_MARKERS } from './seed';

const execFileAsync = promisify(execFile);

const MOCK_PORT = 51231;
const SHIM_PORT = Number(
  new URL(process.env.REDIS_URL || 'http://127.0.0.1:51230').port,
);
const API_PORT = Number(process.env.PORT || 3001);
const API = `http://127.0.0.1:${API_PORT}`;

interface Frame {
  at: number;
  type: string;
  value?: string;
  message?: string;
}

const results: { name: string; ok: boolean; detail: string }[] = [];

function check(name: string, ok: boolean, detail = ''): void {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Posts to /api/chat and returns each SSE frame with the time it arrived. */
function streamChat(
  token: string | null,
  text: string,
  opts: { abortAfterFirstDelta?: boolean } = {},
): Promise<{ status: number; contentType: string; frames: Frame[] }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ messages: [{ sender: 'user', text }] });
    const req = http.request(
      {
        host: '127.0.0.1',
        port: API_PORT,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        const frames: Frame[] = [];
        let buffer = '';
        const started = Date.now();

        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            const line = part.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              frames.push({ ...parsed, at: Date.now() - started });
              if (opts.abortAfterFirstDelta && parsed.type === 'delta') {
                req.destroy();
                resolve({
                  status: res.statusCode || 0,
                  contentType: String(res.headers['content-type'] || ''),
                  frames,
                });
              }
            } catch {
              /* non-JSON frame */
            }
          }
        });

        res.on('end', () =>
          resolve({
            status: res.statusCode || 0,
            contentType: String(res.headers['content-type'] || ''),
            frames,
          }),
        );
      },
    );

    req.on('error', (err) => {
      if (opts.abortAfterFirstDelta) return;
      reject(err);
    });
    req.write(body);
    req.end();
  });
}

async function waitForApi(timeoutMs = 90_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await streamChat(null, 'ping');
      if (res.status) return true;
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  return false;
}

async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const res = await client.query(sql);
    return res.rows as T[];
  } finally {
    await client.end();
  }
}

function textOf(frames: Frame[]): string {
  return frames
    .filter((f) => f.type === 'delta')
    .map((f) => f.value || '')
    .join('');
}

async function main(): Promise<void> {
  const shim = await startUpstashShim(SHIM_PORT);
  const mock = await startMockModelServer(MOCK_PORT);
  // Both listeners keep the event loop alive; without closing them the run
  // finishes its checks and then hangs until something kills it.
  const shutdown = () => {
    shim.close();
    mock.close();
  };
  console.log(`mock model on ${MOCK_PORT}, upstash shim on ${SHIM_PORT}`);

  const seeded: SeedResult = await seed();
  // authenticateRequest requires both a valid JWT and a live session key.
  seedKey(
    `session:${seeded.userA.id}:${seeded.userA.token}`,
    JSON.stringify('1'),
  );
  seedKey(
    `session:${seeded.userB.id}:${seeded.userB.token}`,
    JSON.stringify('1'),
  );
  console.log('seeded users', seeded.userA.id, seeded.userB.id);

  if (!(await waitForApi())) {
    throw new Error('API did not become reachable');
  }

  // Mastra creates its storage lazily, on first use — so the schema checks
  // below only mean anything after at least one request has gone through.
  const warmup = await streamChat(seeded.userA.token, 'Hello');
  const warmupError = warmup.frames.find((f) => f.type === 'error');
  check(
    'warm-up request succeeded without an error frame',
    warmup.status === 200 && !warmupError,
    warmupError
      ? `error frame: ${warmupError.message}`
      : `status ${warmup.status}`,
  );

  // 1. Mastra created its own schema, isolated from Prisma's.
  const schemas = await query<{ nspname: string }>(
    `select nspname from pg_namespace where nspname = 'mastra'`,
  );
  check('mastra schema created', schemas.length === 1);

  const mastraTables = await query<{ count: string }>(
    `select count(*)::text as count from information_schema.tables where table_schema='mastra'`,
  );
  check(
    'mastra tables live outside public',
    Number(mastraTables[0]?.count) > 0,
    `${mastraTables[0]?.count} tables`,
  );

  // 2. Prisma still reports a clean migration state.
  const { stdout } = await execFileAsync(
    'npx',
    ['prisma', 'migrate', 'status'],
    { env: process.env, timeout: 180_000 },
  ).catch((e) => ({ stdout: String(e.stdout || e) }));
  check(
    'prisma reports no drift after mastra schema exists',
    /up to date/i.test(stdout),
    stdout.trim().split('\n').slice(-1)[0],
  );

  // 3. Auth.
  const unauth = await streamChat(null, 'How much did I spend?');
  check(
    'unauthenticated request rejected',
    unauth.status === 401,
    `status ${unauth.status}`,
  );

  // 4-6. The comparison question.
  resetRecording();
  const compare = await streamChat(
    seeded.userA.token,
    'Compare my grocery spending in January versus February',
  );
  const compareText = textOf(compare.frames);

  check(
    'authenticated request streams SSE',
    compare.status === 200 && compare.contentType.includes('text/event-stream'),
    `${compare.status} ${compare.contentType}`,
  );

  const deltas = compare.frames.filter((f) => f.type === 'delta');
  const spread = deltas.length
    ? deltas[deltas.length - 1].at - deltas[0].at
    : 0;
  check(
    'deltas arrive incrementally, not in one burst',
    deltas.length > 1 && spread > 50,
    `${deltas.length} deltas spread over ${spread}ms`,
  );

  const rec = getRecording();
  const compareCalls = rec.toolCalls.filter((c) => c.name === 'comparePeriods');
  check(
    'agent called comparePeriods once',
    compareCalls.length === 1,
    `tools called: ${rec.toolCalls.map((c) => c.name).join(', ') || 'none'}`,
  );

  check(
    'all five tools were offered to the model',
    [
      'listCategories',
      'listTransactions',
      'summarizeTransactions',
      'comparePeriods',
      'getSpendingTrends',
    ].every((t) => rec.toolsOffered.includes(t)),
    rec.toolsOffered.join(', '),
  );

  // The decisive check: the difference and percentage came from TypeScript.
  const toolOutput = rec.toolResults.join('\n');
  check(
    'tool result contains the TS-computed difference',
    toolOutput.includes('1,100.00'),
    toolOutput.replace(/\n/g, ' | ').slice(0, 160),
  );
  check(
    'tool result contains the TS-computed percentage',
    toolOutput.includes('26.83%'),
  );
  check(
    'those figures reached the user',
    compareText.includes('1,100.00') && compareText.includes('26.83%'),
  );

  // 7. Cross-user isolation.
  const leaked = USER_B_MARKERS.filter((m) => compareText.includes(m));
  check(
    "user B's amounts never appear in user A's answer",
    leaked.length === 0,
    leaked.length ? `leaked: ${leaked.join(', ')}` : 'no leakage',
  );

  resetRecording();
  const bStream = await streamChat(
    seeded.userB.token,
    'Compare my grocery spending in January versus February',
  );
  const bText = textOf(bStream.frames);
  check(
    "user B sees only user B's data",
    bText.includes('7,777') &&
      bText.includes('8,888') &&
      !bText.includes('4,100'),
    bText.replace(/\n/g, ' | ').slice(0, 160),
  );

  // 8. Percentage shares come from the breakdown tool.
  resetRecording();
  const share = await streamChat(
    seeded.userA.token,
    'What percentage of my spending was by category?',
  );
  const shareRec = getRecording();
  check(
    'category breakdown returns shares computed in TS',
    shareRec.toolResults.join('\n').includes('%'),
    shareRec.toolResults.join(' | ').slice(0, 160),
  );
  check('share answer reached the user', textOf(share.frames).includes('%'));

  // 9. Memory persisted a thread for this user.
  const threads = await query<{ count: string }>(
    `select count(*)::text as count from mastra.mastra_threads`,
  ).catch(() => [{ count: '0' }]);
  check(
    'memory persisted conversation threads',
    Number(threads[0]?.count) > 0,
    `${threads[0]?.count} threads`,
  );

  // 10. Disconnecting mid-stream stops the run.
  resetRecording();
  await streamChat(seeded.userA.token, 'Compare January versus February', {
    abortAfterFirstDelta: true,
  });
  const callsAtAbort = getRecording().requestCount;
  await sleep(2500);
  const callsAfter = getRecording().requestCount;
  check(
    'client disconnect stops the agent run',
    callsAfter === callsAtAbort,
    `model requests ${callsAtAbort} → ${callsAfter}`,
  );

  // Regression guard: an abrupt disconnect once emitted an unhandled 'error'
  // on the request and killed the process. The API must still be serving.
  const afterAbort = await streamChat(null, 'still alive?').catch(() => null);
  check(
    'API survives an abrupt client disconnect',
    afterAbort?.status === 401,
    afterAbort ? `status ${afterAbort.status}` : 'API unreachable — it crashed',
  );

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`,
  );
  shutdown();

  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.name).join('; '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('harness error:', error);
  process.exit(1);
});
