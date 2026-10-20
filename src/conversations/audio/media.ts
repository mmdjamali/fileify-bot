import { BotContext } from "@/types/context"
import { fileExtension } from "@/utils/file-extension"

// audio, or audio sent as a file
export const getAudio = (ctx: BotContext) => {
    const audio = ctx.message?.audio ?? ctx.message?.document

    return { file: audio, extension: audio ? fileExtension(audio, "mp3") : "mp3" }
}
