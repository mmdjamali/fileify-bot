import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";
import { InlineKeyboard, InputFile } from "grammy";
import sharp from "sharp";
import { remindBusy } from "../options";
import { processFile } from "../process-file";
import { getImage } from "./media";

const FORMATS = ["jpeg", "png", "webp"] as const

export const convert = async (conv: BotConversation, ctx: BotContext) => {
    const { file, extension, name } = getImage(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    const keyboard = new InlineKeyboard()
    FORMATS.forEach((format) => keyboard.text(format.toUpperCase(), `photo:format:${format}`))
    keyboard.row().text(ctx.t("cancel"), "photo:format:cancel")

    const formatMessage = await ctx.reply(ctx.t("photo-convert-prompt"), { reply_markup: keyboard })

    const callbackCtx = await conv.waitForCallbackQuery([...FORMATS.map((format) => `photo:format:${format}`), "photo:format:cancel"], { otherwise: remindBusy })
    await callbackCtx.answerCallbackQuery()

    await ctx.api.deleteMessage(ctx.chat!.id, formatMessage.message_id)

    const format = callbackCtx.callbackQuery.data.split(":")[2]

    if (format === "cancel") {
        await ctx.reply(ctx.t("canceled"))
        return
    }

    const baseName = name?.replace(/\.[^.]*$/, "") || "fileify"

    await processFile(conv, ctx, {
        fileId: file.file_id,
        inputExtension: extension,
        outputExtension: format,
        action: `convert-${format}`,
        process: async (inputPath, outputPath) => {
            await sharp(inputPath).toFormat(format as typeof FORMATS[number]).toFile(outputPath)
        },
        send: (outputPath) => ctx.replyWithDocument(new InputFile(outputPath, `${baseName}.${format}`)),
    })
}
