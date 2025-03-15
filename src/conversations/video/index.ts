import { BotContext } from "@/types/context"
import { Conversation, createConversation } from "@grammyjs/conversations"
import { Context, InlineKeyboard } from "grammy"
import { videoNote } from "./video-note"
import { hydrateFiles } from "@grammyjs/files"
import env from "@/config/env"

export const VIDEO_CONVIRATION_NAME = "video"

export const convirsationHandler = async (conversation: Conversation<Context, BotContext>, ctx: BotContext) => {
    const keyboard = new InlineKeyboard()
        .text(ctx.t("video-note"), "video:video-note")
        .row()
        .text(ctx.t("cancel"), "video:cancel")

    const callbackMessage = await ctx.reply(ctx.t("video"), {
        reply_markup: keyboard
    })

    const callbackCtx = await conversation.waitForCallbackQuery(["video:video-note", "video:cancel"])

    await ctx.api.deleteMessage(ctx.chat!.id, callbackMessage.message_id)

    const handler = handlers[callbackCtx.callbackQuery.data]

    if (!handler) {
        await ctx.reply("Invalid callback query")
        return
    }

    await handler(conversation, ctx)
}

const handlers: Record<string, (conversation: Conversation<Context, BotContext>, ctx: BotContext) => Promise<void>> = {
    "video:video-note": videoNote,
    "video:cancel": async (conversation: Conversation<Context, BotContext>, ctx: BotContext) => {
        await ctx.reply(ctx.t("canceled"))
    }
}

export const videoConversation = createConversation(convirsationHandler, {
    id: VIDEO_CONVIRATION_NAME,
    plugins: [async (ctx, next) => {
        ctx.api.config.use(hydrateFiles(env.BOT_TOKEN));
        await next();
    }]
})
