import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    BOT_TOKEN: z.string(),
    CHANNELS: z.string().transform((v) => v.split(",").map(v => v.trim()).filter(v => v)),
}).passthrough();

const env = envSchema.parse(process.env);

export default env;