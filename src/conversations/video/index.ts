import env from "@/config/env"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { createConversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import { conversationOptions, remindBusy } from "../options"
import { extractAudio } from "./extract-audio"
import { getVideo } from "./media"
import { sticker } from "./sticker"
import { toGif } from "./to-gif"
import { videoNote } from "./video-note"

export const VIDEO_CONVERSATION_NAME = "video"

export const conversationHandler = async (conversation: BotConversation, ctx: BotContext) => {
    const { file } = getVideo(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    if (file.file_size && file.file_size > env.MAX_FILE_SIZE_MB * 1024 * 1024) {
        await ctx.reply(ctx.t("file-size-error", { size: env.MAX_FILE_SIZE_MB }))
        return
    }

    const keyboard = new InlineKeyboard()
        .text(ctx.t("video-note"), "video:video-note")
        .row()
        .text(ctx.t("video-to-gif"), "video:to-gif")
        .text(ctx.t("video-sticker"), "video:sticker")
        .row()
        .text(ctx.t("video-extract-audio"), "video:extract-audio")
        .row()
        .text(ctx.t("cancel"), "video:cancel")

    const callbackMessage = await ctx.reply(ctx.t("video"), {
        reply_markup: keyboard
    })

    const callbackCtx = await conversation.waitForCallbackQuery(Object.keys(handlers), { otherwise: remindBusy })
    await callbackCtx.answerCallbackQuery()

    await ctx.api.deleteMessage(ctx.chat!.id, callbackMessage.message_id)

    await handlers[callbackCtx.callbackQuery.data](conversation, ctx)
}

const handlers: Record<string, (conversation: BotConversation, ctx: BotContext) => Promise<void>> = {
    "video:video-note": videoNote,
    "video:to-gif": toGif,
    "video:sticker": sticker,
    "video:extract-audio": extractAudio,
    "video:cancel": async (conversation: BotConversation, ctx: BotContext) => {
        await ctx.reply(ctx.t("canceled"))
    }
}

export const videoConversation = createConversation(conversationHandler, {
    id: VIDEO_CONVERSATION_NAME,
    ...conversationOptions,
})
