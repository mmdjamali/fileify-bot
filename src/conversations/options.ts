import env from "@/config/env"
import { BotContext } from "@/types/context"
import { hydrateFiles } from "@grammyjs/files"
import { Middleware } from "grammy"

const files: Middleware<BotContext> = async (ctx, next) => {
    ctx.api.config.use(hydrateFiles(env.BOT_TOKEN, { apiRoot: env.BOT_API_ROOT }))
    await next()
}

export const conversationOptions = {
    plugins: [files],
    // an abandoned menu or prompt stops blocking the user after 10 minutes
    maxMillisecondsToWait: 10 * 60 * 1000,
}

// a wait drops updates it doesn't match; tell the user why instead of ignoring them silently
export const remindBusy = async (ctx: BotContext) => {
    if (ctx.message) await ctx.reply(ctx.t("busy"))
    else if (ctx.callbackQuery) await ctx.answerCallbackQuery()
}
