import { createCommand, save } from "./command";

export const removeAudio = (inputPath: string, outputPath: string) => {
    const command = createCommand(inputPath)
        .outputOptions(["-an", "-c:v", "copy"])

    return save(command, outputPath)
}
