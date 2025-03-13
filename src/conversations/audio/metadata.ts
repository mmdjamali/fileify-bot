import { unlinkSync, existsSync } from "fs"

import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";

import updateMetadata from "@/pkg/ffmpeg/update-metadata";
import env from "@/config/env";
import { InputFile } from "grammy";
import logger from "@/utils/logger";

export const metadata = async (conv: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;
    let coverImagePath: string | null = null;
    try {
        const audio = ctx0.message?.audio

        const file = await ctx0.api.getFile(audio?.file_id!)

        await ctx0.reply(ctx0.t("audio-new-title"))

        const ctx1 = await conv.waitFor(":text")

        await ctx1.reply(ctx0.t("audio-new-artist"))

        const ctx2 = await conv.waitFor(":text")

        await ctx2.reply(ctx0.t("audio-new-album"))

        const ctx3 = await conv.waitFor(":text")

        await ctx3.reply(ctx0.t("audio-new-cover"))

        const check = conv.checkpoint()

        const ctx4 = await conv.waitFor([":photo", ":document"])

        if (ctx4.message?.document && !["png", "jpeg", "jpg"].includes(ctx4.message?.document?.file_name!.split(".").at(-1)!)) {
            await ctx4.reply(ctx0.t("audio-new-cover"))
            await conv.rewind(check)
        }

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${await conv.now()}-audio.${audio!.file_name!.split(".").at(-1)}`
        const msg = await ctx0.reply(ctx0.t("downloading"))
        await conv.external(() => file.download(inputPath!))

        const cover = await ctx4.getFile()
        coverImagePath = `${env.DOWNLOAD_DIR}/${cover.file_unique_id}-${await conv.now()}-cover-image.jpeg`
        await conv.external(() => cover.download(coverImagePath!))

        outputPath = `${env.PROCCESSED_DIR}/${file.file_unique_id}-${await conv.now()}-audio.${audio!.file_name!.split(".").at(-1)}`
        await conv.external(() => updateMetadata(inputPath!, outputPath!, {
            title: ctx1.message?.text,
            album: ctx2.message?.text,
            artist: ctx3.message?.text,
        }, coverImagePath!))

        await ctx0.api.editMessageText(ctx0.chat!.id, msg.message_id, ctx0.t("uploading"))

        await ctx0.replyWithAudio(new InputFile(outputPath!), {
            title: ctx1.message?.text,
            performer: ctx2.message?.text,
            thumbnail: new InputFile(coverImagePath)
        })

        await ctx0.api.deleteMessage(ctx0.chat!.id, msg.message_id)
    } catch (err) {
        logger.info(err)
    } finally {
        if (inputPath && existsSync(inputPath)) unlinkSync(inputPath)
        if (outputPath && existsSync(outputPath)) unlinkSync(outputPath)
        if (coverImagePath && existsSync(coverImagePath)) unlinkSync(coverImagePath)
    }
}   