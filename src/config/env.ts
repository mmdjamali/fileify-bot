import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const list = z.string().default("").transform((v) => v.split(",").map(v => v.trim()).filter(v => v))
const optional = z.string().optional().transform((v) => v || undefined)

const envSchema = z.object({
    BOT_TOKEN: z.string().min(1),

    CHANNELS: list,
    ADMIN_IDS: list.transform((ids) => ids.map(Number)),

    DOWNLOAD_DIR: z.string().default("./downloads"),
    PROCESSED_DIR: optional,
    // misspelled legacy name, still accepted so existing .env files keep working
    PROCCESSED_DIR: optional,

    JOB_TIMEOUT_SECONDS: z.coerce.number().positive().default(300),

    REDIS_URL: z.string(),
}).transform(({ PROCCESSED_DIR, PROCESSED_DIR, ...env }) => ({
    ...env,
    PROCESSED_DIR: PROCESSED_DIR ?? PROCCESSED_DIR ?? "./processed",
}));

const env = envSchema.parse(process.env);

export default env;
