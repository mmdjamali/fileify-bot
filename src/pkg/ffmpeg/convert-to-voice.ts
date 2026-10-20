import { createCommand, save } from "./command";

// Telegram voice messages are mono OGG/Opus
export const convertToVoice = (inputPath: string, outputPath: string) => {
    const command = createCommand(inputPath)
        .outputOptions(["-vn", "-map_metadata", "-1", "-c:a", "libopus", "-b:a", "64k", "-ac", "1"])

    return save(command, outputPath)
}
