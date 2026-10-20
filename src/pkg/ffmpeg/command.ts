import ffmpeg, { type FfmpegCommand } from "fluent-ffmpeg";
import env from "@/config/env";

// every command is killed after JOB_TIMEOUT_SECONDS so a bad input can't hold a job slot forever
export const createCommand = (inputPath: string) => {
    return ffmpeg(inputPath, { timeout: env.JOB_TIMEOUT_SECONDS })
}

export const save = (command: FfmpegCommand, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        command
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .save(outputPath)
    })
}
