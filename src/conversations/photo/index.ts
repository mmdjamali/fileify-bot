import env from "@/config/env"
import { BotContext } from "@/types/context"
import { Conversation, createConversation } from "@grammyjs/conversations"
import { hydrateFiles } from "@grammyjs/files"
import { Context, InlineKeyboard } from "grammy"

export const PHOTO_CONVIRATION_NAME = "photo"

export const convirsationHandler = async (conversation: Conversation<BotContext, BotContext>, ctx: BotContext) => {
    const file = ctx.message?.photo?.[0] || ctx.message?.document

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    if (file.file_size && file.file_size > 20 * 1024 * 1024) {
        await ctx.reply(ctx.t("file-size-error", { size: 20 }))
        return
    }

    const keyboard = new InlineKeyboard()
        .text(ctx.t("cancel"), "image:cancel")

    const callbackMessage = await ctx.reply(ctx.t("image"), {
        reply_markup: keyboard
    })

    const callbackCtx = await conversation.waitForCallbackQuery(["image:cancel"])

    await ctx.api.deleteMessage(ctx.chat!.id, callbackMessage.message_id)

    const handler = handlers[callbackCtx.callbackQuery.data]

    if (!handler) {
        await ctx.reply("Invalid callback query")
        return
    }

    await handler(conversation, ctx)
}

const handlers: Record<string, (conversation: Conversation<BotContext, BotContext>, ctx: BotContext) => Promise<void>> = {
    "image:cancel": async (conv: Conversation<BotContext, BotContext>, ctx: BotContext) => {
        await ctx.reply(ctx.t("canceled"))
    }
}

export const photoConversation = createConversation(convirsationHandler, {
    id: PHOTO_CONVIRATION_NAME,
    plugins: [async (ctx, next) => {
        ctx.api.config.use(hydrateFiles(env.BOT_TOKEN));
        await next();
    }]
})