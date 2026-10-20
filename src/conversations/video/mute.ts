import { removeAudio } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getVideo } from "./media"

export const mute = async (conversation: BotConversation, ctx: BotContext) => {
    const { file } = getVideo(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: "mp4",
        outputExtension: "mp4",
        action: "mute",
        process: removeAudio,
        send: (outputPath) => ctx.replyWithVideo(new InputFile(outputPath, "fileify.mp4")),
    })
}
