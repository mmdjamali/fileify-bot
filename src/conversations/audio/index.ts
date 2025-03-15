import { BotContext } from "@/types/context"
import { Conversation, createConversation } from "@grammyjs/conversations"
import { Context, InlineKeyboard } from "grammy"
import { hydrateFiles } from "@grammyjs/files"
import env from "@/config/env"
import { metadata } from "./metadata"

export const AUDIO_CONVIRATION_NAME = "audio"

export const convirsationHandler = async (conversation: Conversation<Context, BotContext>, ctx: BotContext) => {
    const keyboard = new InlineKeyboard()
        .text(ctx.t("audio-metadata"), "audio:edit-metadata")
        .row()
        .text(ctx.t("cancel"), "audio:cancel")

    const callbackMessage = await ctx.reply(ctx.t("audio"), {
        reply_markup: keyboard
    })

    const callbackCtx = await conversation.waitForCallbackQuery(["audio:edit-metadata", "audio:cancel"])

    await ctx.api.deleteMessage(ctx.chat!.id, callbackMessage.message_id)

    const handler = handlers[callbackCtx.callbackQuery.data]

    if (!handler) {
        await ctx.reply("Invalid callback query")
        return
    }

    await handler(conversation, ctx)
}

const handlers: Record<string, (conversation: Conversation<Context, BotContext>, ctx: BotContext) => Promise<void>> = {
    "audio:edit-metadata": metadata,
    "audio:cancel": async (conv: Conversation<Context, BotContext>, ctx: BotContext) => {
        await ctx.reply(ctx.t("canceled"))
    }
}

export const audioConversation = createConversation(convirsationHandler, {
    id: AUDIO_CONVIRATION_NAME,
    plugins: [async (ctx, next) => {
        ctx.api.config.use(hydrateFiles(env.BOT_TOKEN));
        await next();
    }]
})
