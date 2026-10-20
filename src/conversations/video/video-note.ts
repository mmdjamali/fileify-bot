import { convertVideoToSquare } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getVideo, maxDuration } from "./media"

const MAX_SECONDS = 60

export const videoNote = async (conversation: BotConversation, ctx: BotContext) => {
    const { file, duration } = getVideo(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    if (duration !== undefined && duration > MAX_SECONDS) {
        await ctx.reply(ctx.t("video-too-long"))
        return
    }

    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: "mp4",
        outputExtension: "mp4",
        action: "video-note",
        validate: duration === undefined ? maxDuration(MAX_SECONDS, ctx.t("video-too-long")) : undefined,
        process: convertVideoToSquare,
        send: (outputPath) => ctx.replyWithVideoNote(new InputFile(outputPath)),
    })
}
