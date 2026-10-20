import { getDuration } from "@/pkg/ffmpeg"
import { BotContext } from "@/types/context"

// video, GIF, or a video sent as a file (which carries no duration)
export const getVideo = (ctx: BotContext) => {
    const media = ctx.message?.video ?? ctx.message?.animation

    return {
        file: media ?? ctx.message?.document,
        duration: media?.duration,
    }
}

export const maxDuration = (seconds: number, message: string) => async (inputPath: string) => {
    return await getDuration(inputPath) > seconds ? message : undefined
}
