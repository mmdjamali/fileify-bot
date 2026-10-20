import redis from "./client";
import logger from "@/utils/logger";

const USERS_KEY = "fileify:users"
const JOBS_KEY = "fileify:jobs"

export const trackUser = (userId: number) => {
    redis.sadd(USERS_KEY, userId).catch((err) => logger.error(`stats => ${err.message}`))
}

export const recordJob = (action: string) => {
    redis.hincrby(JOBS_KEY, action, 1).catch((err) => logger.error(`stats => ${err.message}`))
}

export const getStats = async () => {
    const [users, jobs] = await Promise.all([redis.scard(USERS_KEY), redis.hgetall(JOBS_KEY)])

    return { users, jobs: Object.entries(jobs).map(([action, count]) => ({ action, count: Number(count) })) }
}
