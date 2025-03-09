import env from "@/config/env"
import { convertVideoToSquare } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import logger from "@/utils/logger"
import { InputFile } from "grammy"

import { } from "@grammyjs/files"

import { unlinkSync, existsSync } from "fs"

export const videoNote = async (conversation: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;

    try {
        const video = ctx0.message?.video

        if (!video || video?.duration > 60) {
            await ctx0.reply("Video is too long")
            return
        }

        if (!ctx0.chat) {
            conversation.external(() => logger.error("no chat found"))
            return
        }

        const file = await ctx0.api.getFile(video?.file_id!)

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${Date.now()}-video-note.mp4`
        const msg = await ctx0.reply("Downloading...")
        await file.download(inputPath)

        await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, "Processing...")

        outputPath = `${env.PROCCESSED_DIR}/${file.file_unique_id}-${Date.now()}-video-note.mp4`
        await conversation.external(() => convertVideoToSquare(inputPath!, outputPath!))

        await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, "Uploading...")

        await ctx0.replyWithVideoNote(new InputFile(outputPath))

        await ctx0.api.deleteMessage(ctx0.chat.id, msg.message_id)

    } catch (err) {
        logger.error(err)
    } finally {
        if (inputPath && existsSync(inputPath)) unlinkSync(inputPath)
        if (outputPath && existsSync(outputPath)) unlinkSync(outputPath)
    }
}