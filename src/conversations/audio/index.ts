import env from "@/config/env"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { createConversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import { conversationOptions, remindBusy } from "../options"
import { getAudio } from "./media"
import { metadata } from "./metadata"

export const AUDIO_CONVERSATION_NAME = "audio"

export const conversationHandler = async (conversation: BotConversation, ctx: BotContext) => {
    const { file } = getAudio(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    if (file.file_size && file.file_size > env.MAX_FILE_SIZE_MB * 1024 * 1024) {
        await ctx.reply(ctx.t("file-size-error", { size: env.MAX_FILE_SIZE_MB }))
        return
    }

    const keyboard = new InlineKeyboard()
        .text(ctx.t("audio-metadata"), "audio:edit-metadata")
        .row()
        .text(ctx.t("cancel"), "audio:cancel")

    const callbackMessage = await ctx.reply(ctx.t("audio"), {
        reply_markup: keyboard
    })

    const callbackCtx = await conversation.waitForCallbackQuery(Object.keys(handlers), { otherwise: remindBusy })
    await callbackCtx.answerCallbackQuery()

    await ctx.api.deleteMessage(ctx.chat!.id, callbackMessage.message_id)

    await handlers[callbackCtx.callbackQuery.data](conversation, ctx)
}

const handlers: Record<string, (conversation: BotConversation, ctx: BotContext) => Promise<void>> = {
    "audio:edit-metadata": metadata,
    "audio:cancel": async (conv: BotConversation, ctx: BotContext) => {
        await ctx.reply(ctx.t("canceled"))
    }
}

export const audioConversation = createConversation(conversationHandler, {
    id: AUDIO_CONVERSATION_NAME,
    ...conversationOptions,
})
