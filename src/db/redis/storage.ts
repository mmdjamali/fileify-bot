import { RedisAdapter } from "@grammyjs/storage-redis";
import redis from "./client";

export const redisStorage = new RedisAdapter({
    instance: redis,
    ttl: 0,
    autoParseDates: true,
})