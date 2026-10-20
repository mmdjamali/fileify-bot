import { convertToMp3 } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getAudio } from "./media"

export const toMp3 = async (conversation: BotConversation, ctx: BotContext) => {
    const { file, extension } = getAudio(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    const name = "file_name" in file && file.file_name ? file.file_name.replace(/\.[^.]*$/, "") : "fileify"

    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: extension,
        outputExtension: "mp3",
        action: "to-mp3",
        process: convertToMp3,
        send: (outputPath) => ctx.replyWithAudio(new InputFile(outputPath, `${name}.mp3`)),
    })
}
