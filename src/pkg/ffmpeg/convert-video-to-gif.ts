import ffmpeg from "fluent-ffmpeg";

export const convertVideoToGif = (inputPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            // palettegen/paletteuse keeps colors sane; 15fps + max 480px wide keeps size down
            .outputOptions([
                "-vf", "fps=15,scale=min(480\\,iw):-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                "-loop", "0",
            ])
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .save(outputPath);
    });
}
