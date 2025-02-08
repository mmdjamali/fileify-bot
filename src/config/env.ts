import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    BOT_TOKEN: z.string(),
}).passthrough();

const env = envSchema.parse(process.env);

export default env;