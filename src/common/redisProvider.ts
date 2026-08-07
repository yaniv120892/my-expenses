import { Redis } from '@upstash/redis';

const redisUrl = process.env.REDIS_URL || '';
const redisToken = process.env.REDIS_TOKEN || '';
const redisClient = new Redis({
  url: redisUrl,
  token: redisToken,
});

async function setValue(key: string, value: unknown, ttlSeconds: number) {
  await redisClient.set(key, value, { ex: ttlSeconds });
}

/**
 * Generic so callers can name the shape they cached, instead of every call site
 * widening to `any`. Defaults to `unknown` when no type is supplied.
 */
async function getValue<T = unknown>(key: string): Promise<T | null> {
  const value = await redisClient.get<T>(key);
  if (value === null) {
    return null;
  }

  return value;
}

async function deleteValue(key: string) {
  await redisClient.del(key);
}

export { setValue, getValue, deleteValue };
