import { Redis } from '@upstash/redis';

const redisUrl = process.env.REDIS_URL || '';
const redisToken = process.env.REDIS_TOKEN || '';
const redisClient = new Redis({
  url: redisUrl,
  token: redisToken,
});

async function setValue(key: string, value: string, ttlSeconds: number) {
  await redisClient.set(key, value, { ex: ttlSeconds });
}

async function getValue(key: string): Promise<string | null> {
  const value = await redisClient.get<string>(key);
  return value !== null ? String(value) : null;
}

async function deleteValue(key: string) {
  await redisClient.del(key);
}

export { setValue, getValue, deleteValue };
