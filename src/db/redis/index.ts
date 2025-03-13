import env from "@/config/env"
import IORedis from "ioredis"

const redis = new IORedis(env.REDIS_URL)

export default redis

export * from "./storage"