import { BotContext } from "@/types/context"
import { fileExtension } from "@/utils/file-extension"

// audio, voice message, or audio sent as a file
export const getAudio = (ctx: BotContext) => {
    const voice = ctx.message?.voice

    if (voice) return { file: voice, extension: fileExtension(voice, "ogg") }

    const audio = ctx.message?.audio ?? ctx.message?.document

    return { file: audio, extension: audio ? fileExtension(audio, "mp3") : "mp3" }
}
