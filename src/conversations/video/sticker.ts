import { convertVideoToSticker } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getVideo } from "./media"

export const sticker = async (conversation: BotConversation, ctx: BotContext) => {
    const { file } = getVideo(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    // longer videos are cut to the first 3 seconds, the video sticker limit
    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: "mp4",
        outputExtension: "webm",
        action: "video-sticker",
        process: convertVideoToSticker,
        send: async (outputPath) => {
            try {
                await ctx.replyWithSticker(new InputFile(outputPath, "fileify.webm"))
            } catch {
                // Telegram rejects stickers it considers invalid; the file is still useful for @Stickers
                await ctx.replyWithDocument(new InputFile(outputPath, "fileify.webm"))
            }
        },
    })
}
