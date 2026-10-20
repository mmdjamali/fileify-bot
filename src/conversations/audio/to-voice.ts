import { convertToVoice } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { InputFile } from "grammy"
import { processFile } from "../process-file"
import { getAudio } from "./media"

export const toVoice = async (conversation: BotConversation, ctx: BotContext) => {
    const { file, extension } = getAudio(ctx)

    if (!file) {
        await ctx.reply(ctx.t("error"))
        return
    }

    await processFile(conversation, ctx, {
        fileId: file.file_id,
        inputExtension: extension,
        outputExtension: "ogg",
        action: "to-voice",
        process: convertToVoice,
        send: (outputPath) => ctx.replyWithVoice(new InputFile(outputPath)),
    })
}
