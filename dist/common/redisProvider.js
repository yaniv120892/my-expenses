"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setValue = setValue;
exports.getValue = getValue;
exports.deleteValue = deleteValue;
const redis_1 = require("@upstash/redis");
const redisUrl = process.env.REDIS_URL || '';
const redisToken = process.env.REDIS_TOKEN || '';
const redisClient = new redis_1.Redis({
    url: redisUrl,
    token: redisToken,
});
async function setValue(key, value, ttlSeconds) {
    await redisClient.set(key, value, { ex: ttlSeconds });
}
async function getValue(key) {
    const value = await redisClient.get(key);
    return value !== null ? String(value) : null;
}
async function deleteValue(key) {
    await redisClient.del(key);
}
