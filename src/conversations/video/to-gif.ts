import env from "@/config/env"
import { convertVideoToGif } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import logger from "@/utils/logger"
import { InputFile } from "grammy"
import type { Message } from "grammy/types";

import { unlinkSync, existsSync } from "fs"

export const toGif = async (conversation: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;


    let msg: null | Message.TextMessage = null;
    try {
        const video = ctx0.message?.video ?? ctx0.message?.animation

        if (!video || video.duration > 30) {
            await ctx0.reply(ctx0.t("gif-too-long", { seconds: 30 }))
            return
        }

        if (!ctx0.chat) {
            conversation.external(() => logger.error("no chat found"))
            return
        }

        const file = await ctx0.api.getFile(video?.file_id!)

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${Date.now()}-gif.mp4`
        msg = await ctx0.reply(ctx0.t("downloading"))
        await file.download(inputPath)

        await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, ctx0.t("processing"))

        outputPath = `${env.PROCCESSED_DIR}/${file.file_unique_id}-${Date.now()}-gif.gif`
        await conversation.external(() => convertVideoToGif(inputPath!, outputPath!))

        await ctx0.api.editMessageText(ctx0.chat.id, msg.message_id, ctx0.t("uploading"))

        await ctx0.replyWithDocument(new InputFile(outputPath, "fileify.gif"), { disable_content_type_detection: true })

        await ctx0.api.deleteMessage(ctx0.chat.id, msg.message_id)

        logger.info(`${ctx0.from?.id} => ${[ctx0.from?.first_name, ctx0.from?.last_name].filter(v => !!v).join(" ")} turned a video into a gif`)
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