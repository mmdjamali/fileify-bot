import ffmpeg from "fluent-ffmpeg";

export const convertVideoToSquare = (inputPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoFilters([
                "crop=min(iw\\,ih):min(iw\\,ih)",
                "scale=360:360",
                "format=yuv420p",
                "setsar=1",
            ])
            .outputOptions(["-c:v libx264", "-profile:v baseline", "-level 3.0", "-pix_fmt yuv420p"])
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .save(outputPath);
    });
}
