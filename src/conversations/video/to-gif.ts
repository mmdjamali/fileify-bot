import { convertVideoToGif } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getVideo, maxDuration } from "./media"

const MAX_SECONDS = 30

export const toGif = async (conversation: BotConversation, ctx: BotContext) => {
    const { file, duration } = getVideo(ctx)
    const tooLong = ctx.t("gif-too-long", { seconds: MAX_SECONDS })

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    if (duration !== undefined && duration > MAX_SECONDS) {
        await ctx.reply(tooLong)
        return
    }

    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: "mp4",
        outputExtension: "gif",
        action: "gif",
        validate: duration === undefined ? maxDuration(MAX_SECONDS, tooLong) : undefined,
        process: convertVideoToGif,
        // sent as a document so Telegram doesn't re-encode it back into an mp4 "GIF"
        send: (outputPath) => ctx.replyWithDocument(new InputFile(outputPath, "fileify.gif"), { disable_content_type_detection: true }),
    })
}
