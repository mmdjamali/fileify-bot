import env from "@/config/env"
import { BotContext } from "@/types/context"
import { hydrateFiles } from "@grammyjs/files"
import { Middleware } from "grammy"

const files: Middleware<BotContext> = async (ctx, next) => {
    ctx.api.config.use(hydrateFiles(env.BOT_TOKEN))
    await next()
}

export const conversationOptions = {
    plugins: [files],
    // an abandoned menu or prompt stops blocking the user after 10 minutes
    maxMillisecondsToWait: 10 * 60 * 1000,
}
