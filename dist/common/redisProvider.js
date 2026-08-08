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
/**
 * Generic so callers can name the shape they cached, instead of every call site
 * widening to `any`. Defaults to `unknown` when no type is supplied.
 */
async function getValue(key) {
    const value = await redisClient.get(key);
    if (value === null) {
        return null;
    }
    return value;
}
async function deleteValue(key) {
    await redisClient.del(key);
}
