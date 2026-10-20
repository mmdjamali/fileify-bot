import { createCommand, save } from "./command";

export const convertToMp3 = (inputPath: string, outputPath: string) => {
    const command = createCommand(inputPath)
        .outputOptions(["-vn", "-c:a", "libmp3lame", "-q:a", "2"])

    return save(command, outputPath)
}
