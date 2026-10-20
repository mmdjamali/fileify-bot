import { convertToMp3, hasAudio } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getVideo } from "./media"

export const extractAudio = async (conversation: BotConversation, ctx: BotContext) => {
    const { file } = getVideo(ctx)
    const noAudio = ctx.t("no-audio")

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: "mp4",
        outputExtension: "mp3",
        action: "extract-audio",
        validate: async (inputPath) => await hasAudio(inputPath) ? undefined : noAudio,
        process: convertToMp3,
        send: (outputPath) => ctx.replyWithAudio(new InputFile(outputPath, "fileify.mp3")),
    })
}
