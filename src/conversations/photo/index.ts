import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { createConversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import { conversationOptions, remindBusy } from "../options"
import { getImage } from "./media"
import { resize } from "./resize"

export const PHOTO_CONVERSATION_NAME = "photo"

export const conversationHandler = async (conversation: BotConversation, ctx: BotContext) => {
    const { file } = getImage(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    if (file.file_size && file.file_size > 20 * 1024 * 1024) {
        await ctx.reply(ctx.t("file-size-error", { size: 20 }))
        return
    }

    const keyboard = new InlineKeyboard()
        .text(ctx.t("photo-resize"), "photo:resize")
        .row()
        .text(ctx.t("cancel"), "photo:cancel")

    const callbackMessage = await ctx.reply(ctx.t("photo"), {
        reply_markup: keyboard
    })

    const callbackCtx = await conversation.waitForCallbackQuery(Object.keys(handlers), { otherwise: remindBusy })
    await callbackCtx.answerCallbackQuery()

    await ctx.api.deleteMessage(ctx.chat!.id, callbackMessage.message_id)

    await handlers[callbackCtx.callbackQuery.data](conversation, ctx)
}

const handlers: Record<string, (conversation: BotConversation, ctx: BotContext) => Promise<void>> = {
    "photo:cancel": async (conv: BotConversation, ctx: BotContext) => {
        await ctx.reply(ctx.t("canceled"))
    },
    "photo:resize": resize,
}

export const photoConversation = createConversation(conversationHandler, {
    id: PHOTO_CONVERSATION_NAME,
    ...conversationOptions,
})
