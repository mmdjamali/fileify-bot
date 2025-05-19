import { unlinkSync, existsSync } from "fs"

import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";

import env from "@/config/env";
import { InputFile } from "grammy";
import logger from "@/utils/logger";
import { Message } from "grammy/types";
import sharp from "sharp";

export const resize = async (conv: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;

    let msg: null | Message.TextMessage = null;

    try {
        console.log(ctx0.message?.photo)
        const photo = ctx0.message?.photo?.at(-1) || ctx0.message?.document

        const file = await ctx0.api.getFile(photo?.file_id!)

        msg = await ctx0.reply(ctx0.t("downloading"))

        const format = "file_name" in photo! ? photo!.file_name!.split(".").at(-1) : "jpeg"

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${await conv.now()}-photo.${format}`
        await conv.external(() => file.download(inputPath!))

        await ctx0.api.deleteMessage(ctx0.chat!.id, msg.message_id)

        const metadata = await conv.external(() => sharp(inputPath!).metadata())

        await ctx0.reply(ctx0.t("photo-resize-prompt", { width: metadata.width!, height: metadata.height! }))

        const cpt1 = conv.checkpoint()

        const ctx1 = await conv.waitFor(":text")

        if (!ctx1.message?.text.match(/^\d+x\d+$/)) {
            await ctx0.reply(ctx0.t("photo-resize-invalid"))
            await conv.rewind(cpt1)
        }

        const [width, height] = ctx1.message?.text!.split("x").map(v => parseInt(v))!

        if (width <= 0 || height <= 0) {
            await ctx0.reply(ctx0.t("photo-resize-invalid"))
            await conv.rewind(cpt1)
        }
        msg = await ctx0.reply(ctx0.t("processing"))

        outputPath = `${env.PROCCESSED_DIR}/${file.file_unique_id}-${await conv.now()}-photo.${format}`

        await conv.external(() => sharp(inputPath!)
            .resize(width, height)
            .toFile(outputPath!))

        await ctx0.api.editMessageText(ctx0.chat!.id, msg.message_id, ctx0.t("uploading"))

        await ctx0.replyWithDocument(new InputFile(outputPath!, "file_name" in photo! ? photo.file_name : `resized-by-fileify.jpg`))

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
    }
}   