import { createCommand, save } from "./command";

export const convertVideoToGif = (inputPath: string, outputPath: string) => {
    // palettegen/paletteuse keeps colors sane; 15fps + max 480px wide keeps size down
    const command = createCommand(inputPath)
        .outputOptions([
            "-vf", "fps=15,scale=min(480\\,iw):-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
            "-loop", "0",
        ])

    return save(command, outputPath)
}
