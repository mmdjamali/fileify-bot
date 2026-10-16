import env from "@/config/env"
import { convertVideoToSquare, getDuration } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import logger from "@/utils/logger"
import { InputFile } from "grammy"
import type { Message } from "grammy/types";

import { unlinkSync, existsSync } from "fs"

export const videoNote = async (conversation: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;


    let msg: null | Message.TextMessage = null;
    try {
        const media = ctx0.message?.video ?? ctx0.message?.animation
        const video = media ?? ctx0.message?.document

        if (!video) {
            await ctx0.reply(ctx0.t("error"))
            return
        }

        if (media && media.duration > 60) {
            await ctx0.reply(ctx0.t("video-too-long"))
            return
        }

        if (!ctx0.chat) {
            conversation.external(() => logger.error("no chat found"))
            return
        }

        const file = await ctx0.api.getFile(video.file_id)

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${Date.now()}-video-note.mp4`
        msg = await ctx0.reply(ctx0.t("downloading"))
        await conversation.external(() => file.download(inputPath!))

        // documents carry no duration, so probe the downloaded file
        if (!media && await conversation.external(() => getDuration(inputPath!)) > 60) {
            await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, ctx0.t("video-too-long"))
            return
        }

        await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, ctx0.t("processing"))

        outputPath = `${env.PROCCESSED_DIR}/${file.file_unique_id}-${Date.now()}-video-note.mp4`
        await conversation.external(() => convertVideoToSquare(inputPath!, outputPath!))

        await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, ctx0.t("uploading"))

        await ctx0.replyWithVideoNote(new InputFile(outputPath))

        await ctx0.api.deleteMessage(ctx0.chat.id, msg.message_id)

        logger.info(`${ctx0.from?.id} => ${[ctx0.from?.first_name, ctx0.from?.last_name].filter(v => !!v).join(" ")} turned a video into a video note`)
    } catch (err) {
        if (err instanceof Error) {
            err.message ? logger.error(`${ctx0.from?.id} => ${err.message}`) : logger.error(`${ctx0.from?.id} => ${err}`)
        } else {
            logger.error(`${ctx0.from?.id} => ${err}`)
        }

        if (msg) {
            await ctx0.api.editMessageText(ctx0.chat!.id, msg.message_id, ctx0.t("error"))
        } else {
            ctx0.reply(ctx0.t("error"))
        }
    } finally {
        if (inputPath && existsSync(inputPath)) unlinkSync(inputPath)
        if (outputPath && existsSync(outputPath)) unlinkSync(outputPath)
    }
}