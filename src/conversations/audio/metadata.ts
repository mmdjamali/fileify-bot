import { unlinkSync, existsSync } from "fs"

import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";

import updateMetadata from "@/pkg/ffmpeg/update-metadata";
import env from "@/config/env";
import { InlineKeyboard, InputFile } from "grammy";
import logger from "@/utils/logger";
import { Message } from "grammy/types";

export const metadata = async (conv: BotConversation, ctx0: BotContext) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;
    let coverImagePath: string | null = null;

    let msg: null | Message.TextMessage = null;

    try {
        const audio = ctx0.message?.audio

        const file = await ctx0.api.getFile(audio?.file_id!)

        await ctx0.reply(ctx0.t("audio-new-title"))

        const ctx1 = await conv.waitFor(":text")

        await ctx1.reply(ctx0.t("audio-new-artist"))

        const ctx2 = await conv.waitFor(":text")

        await ctx2.reply(ctx0.t("audio-new-album"))

        const ctx3 = await conv.waitFor(":text")

        const coverImageKeyboard = new InlineKeyboard()
            .text(ctx0.t("skip"), "audio:metadata:skip")

        const check = conv.checkpoint()

        const coverMessage = await ctx3.reply(ctx0.t("audio-new-cover"), {
            reply_markup: coverImageKeyboard
        })

        const ctx4 = await conv.waitFor([":photo", ":document", "callback_query:data"])

        if (ctx4.message?.document && !["png", "jpeg", "jpg"].includes(ctx4.message?.document?.file_name!.split(".").at(-1)!)) {
            await ctx0.api.deleteMessage(ctx0.chat!.id, coverMessage.message_id)
            await conv.rewind(check)
        }

        if (ctx4.callbackQuery?.data !== "audio:metadata:skip") {
            await ctx0.api.editMessageReplyMarkup(ctx0.chat!.id, coverMessage.message_id)
            msg = await ctx0.reply(ctx0.t("downloading"))
            const cover = await ctx4.getFile()
            coverImagePath = `${env.DOWNLOAD_DIR}/${cover.file_unique_id}-${await conv.now()}-cover-image.jpeg`
            await conv.external(() => cover.download(coverImagePath!))
        } else {
            await ctx0.api.deleteMessage(ctx0.chat!.id, coverMessage.message_id)
        }

        if (!msg) msg = await ctx0.reply(ctx0.t("downloading"))

        inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${await conv.now()}-audio.${audio!.file_name!.split(".").at(-1)}`
        await conv.external(() => file.download(inputPath!))

        await ctx0.api.editMessageText(ctx0.chat!.id, msg.message_id, ctx0.t("processing"))

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
            thumbnail: coverImagePath ? new InputFile(coverImagePath!) : undefined,
        })

        await ctx0.api.deleteMessage(ctx0.chat!.id, msg.message_id)

        logger.info(`${ctx0.from?.id} => ${[ctx0.from?.first_name, ctx0.from?.last_name].filter(v => !!v).join(" ")} edited audio ${audio?.file_name} with title ${ctx1.message?.text} and artist ${ctx2.message?.text}`)
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