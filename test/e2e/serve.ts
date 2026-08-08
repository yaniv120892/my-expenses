import { startUpstashShim, seedKey } from './upstashShim';
import { startMockModelServer } from './mockModelServer';
import { seed } from './seed';

/**
 * Starts the supporting services and seeds data, then stays up.
 *
 * `run.ts` does this inline and exits; the browser test needs the same stack
 * alive while Playwright drives the website, so this keeps it running and
 * prints the auth token for the test to use.
 */
const MOCK_PORT = Number(process.env.E2E_MOCK_PORT || 51231);
const SHIM_PORT = Number(
  new URL(process.env.REDIS_URL || 'http://127.0.0.1:51230').port,
);

async function main(): Promise<void> {
  await startUpstashShim(SHIM_PORT);
  await startMockModelServer(MOCK_PORT);

  const seeded = await seed();
  seedKey(
    `session:${seeded.userA.id}:${seeded.userA.token}`,
    JSON.stringify('1'),
  );
  seedKey(
    `session:${seeded.userB.id}:${seeded.userB.token}`,
    JSON.stringify('1'),
  );

  // Consumed by the Playwright run.
  console.log(`E2E_AUTH_TOKEN=${seeded.userA.token}`);
  console.log(`E2E_USER_ID=${seeded.userA.id}`);
  console.log('ready');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
