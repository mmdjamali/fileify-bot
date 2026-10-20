import ffmpeg, { type FfprobeData } from "fluent-ffmpeg";

const probe = (inputPath: string): Promise<FfprobeData> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => err ? reject(err) : resolve(data))
    })
}

export const getDuration = async (inputPath: string) => {
    return (await probe(inputPath)).format.duration ?? 0
}

export const hasAudio = async (inputPath: string) => {
    return (await probe(inputPath)).streams.some((stream) => stream.codec_type === "audio")
}
