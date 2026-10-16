import ffmpeg from "fluent-ffmpeg";

export const getDuration = (inputPath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => {
            if (err) return reject(err)
            resolve(data.format.duration ?? 0)
        })
    });
}
