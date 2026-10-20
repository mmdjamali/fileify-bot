import { createCommand, save } from "./command";

export const convertVideoToSquare = (inputPath: string, outputPath: string) => {
    const command = createCommand(inputPath)
        .videoFilters([
            "crop=min(iw\\,ih):min(iw\\,ih)",
            "scale=360:360",
            "format=yuv420p",
            "setsar=1",
        ])
        .outputOptions(["-c:v libx264", "-profile:v baseline", "-level 3.0", "-pix_fmt yuv420p"])

    return save(command, outputPath)
}
