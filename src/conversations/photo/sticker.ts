import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";
import { InputFile } from "grammy";
import sharp from "sharp";
import { processFile } from "../process-file";
import { getImage } from "./media";

// Telegram static stickers: WebP with one side exactly 512px
export const sticker = async (conv: BotConversation, ctx: BotContext) => {
    const { file, extension } = getImage(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    await processFile(conv, ctx, {
        fileId: file.file_id,
        inputExtension: extension,
        outputExtension: "webp",
        action: "photo-sticker",
        process: async (inputPath, outputPath) => {
            await sharp(inputPath).resize(512, 512, { fit: "inside" }).webp().toFile(outputPath)
        },
        send: (outputPath) => ctx.replyWithSticker(new InputFile(outputPath, "fileify.webp")),
    })
}
