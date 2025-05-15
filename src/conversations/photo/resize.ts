import { unlinkSync, existsSync } from "fs"

import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";

import updateMetadata from "@/pkg/ffmpeg/update-metadata";
import env from "@/config/env";
import { InlineKeyboard, InputFile } from "grammy";
import logger from "@/utils/logger";
import { Message } from "grammy/types";
import sharp from "sharp";

export const resize = async (conv: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;
    let coverImagePath: string | null = null;

    let msg: null | Message.TextMessage = null;

    try {
        const photo = ctx0.message?.photo?.[0] || ctx0.message?.document

        const file = await ctx0.api.getFile(photo?.file_id!)

        if (!msg) msg = await ctx0.reply(ctx0.t("downloading"))

        const format = "file_name" in photo! ? photo!.file_name!.split(".").at(-1) : "jpeg"

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${await conv.now()}-photo.${format}`
        await conv.external(() => file.download(inputPath!))

        await ctx0.api.deleteMessage(ctx0.chat!.id, msg.message_id)

        const metadata = await sharp(inputPath!).metadata()

        await ctx0.reply(
            `📐 Current size: ${metadata.width}x${metadata.height}\n\n` +
            `What dimensions would you like to resize it to?\n` +
            `Reply with WIDTHxHEIGHT (like 512x512)`
        )

        const ctx1 = await conv.waitFor(":text")

        await ctx0.api.editMessageText(ctx0.chat!.id, msg.message_id, ctx0.t("processing"))

        outputPath = `${env.PROCCESSED_DIR}/${file.file_unique_id}-${await conv.now()}-photo.${format}`

        await ctx0.api.editMessageText(ctx0.chat!.id, msg.message_id, ctx0.t("uploading"))

        await ctx0.replyWithDocument(new InputFile(outputPath!))

        await ctx0.api.deleteMessage(ctx0.chat!.id, msg.message_id)

        logger.info(`${ctx0.from?.id} => ${[ctx0.from?.first_name, ctx0.from?.last_name].filter(v => !!v).join(" ")} resized photo with input ${ctx1.message?.text}`)
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
        if (coverImagePath && existsSync(coverImagePath)) unlinkSync(coverImagePath)
    }
}   