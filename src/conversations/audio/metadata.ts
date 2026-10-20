import env from "@/config/env";
import updateMetadata from "@/pkg/ffmpeg/update-metadata";
import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";
import { InlineKeyboard, InputFile } from "grammy";
import { remindBusy } from "../options";
import { processFile } from "../process-file";
import { getAudio } from "./media";

const KEEP = "-"

export const metadata = async (conv: BotConversation, ctx0: BotContext) => {
    const { file: audio, extension } = getAudio(ctx0)

    if (!audio) {
        await ctx0.reply(ctx0.t("error"))
        return
    }

    const current = ctx0.message?.audio

    // "-" keeps the current value; ffmpeg copies existing tags we don't override
    const ask = async (key: string) => {
        await ctx0.reply(`${ctx0.t(key)}\n\n${ctx0.t("audio-keep-hint")}`)
        const answer = (await conv.waitFor(":text", { otherwise: remindBusy })).message?.text?.trim()
        return answer && answer !== KEEP ? answer : undefined
    }

    const title = await ask("audio-new-title")
    const artist = await ask("audio-new-artist")
    const album = await ask("audio-new-album")

    const coverImageKeyboard = new InlineKeyboard()
        .text(ctx0.t("skip"), "audio:metadata:skip")

    const check = conv.checkpoint()

    const coverMessage = await ctx0.reply(ctx0.t("audio-new-cover"), {
        reply_markup: coverImageKeyboard
    })

    const ctx4 = await conv.waitFor([":photo", ":document", "callback_query:data"], {
        otherwise: (ctx) => ctx.reply(ctx.t("audio-cover-invalid")),
    })

    if (ctx4.callbackQuery) {
        await ctx4.answerCallbackQuery()

        // ignore taps on buttons from older messages
        if (ctx4.callbackQuery.data !== "audio:metadata:skip") {
            await ctx0.api.deleteMessage(ctx0.chat!.id, coverMessage.message_id)
            await conv.rewind(check)
        }

        await ctx0.api.deleteMessage(ctx0.chat!.id, coverMessage.message_id)
    } else {
        const document = ctx4.message?.document

        if (document && !["image/jpeg", "image/png"].includes(document.mime_type ?? "")) {
            await ctx4.reply(ctx0.t("audio-cover-invalid"))
            await ctx0.api.deleteMessage(ctx0.chat!.id, coverMessage.message_id)
            await conv.rewind(check)
        }

        await ctx0.api.editMessageReplyMarkup(ctx0.chat!.id, coverMessage.message_id)
    }

    const cover = ctx4.callbackQuery ? undefined : await ctx4.getFile()
    const coverImagePath = `${env.DOWNLOAD_DIR}/${cover?.file_unique_id}-${await conv.now()}-cover-image.jpeg`

    await processFile(conv, ctx0, {
        fileId: audio.file_id,
        inputExtension: extension,
        outputExtension: extension,
        action: "audio-metadata",
        cleanup: [coverImagePath],
        process: async (inputPath, outputPath) => {
            if (cover) await cover.download(coverImagePath)
            await updateMetadata(inputPath, outputPath, { title, artist, album }, cover ? coverImagePath : undefined)
        },
        send: (outputPath) => ctx0.replyWithAudio(new InputFile(outputPath, "file_name" in audio ? audio.file_name : undefined), {
            title: title ?? current?.title,
            performer: artist ?? current?.performer,
            thumbnail: cover ? new InputFile(coverImagePath) : undefined,
        }),
    })
}
