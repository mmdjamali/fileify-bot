import { createCommand, save } from "./command";

// Telegram video stickers: VP9 WebM, one side exactly 512px, at most 3s, no audio, up to 256 KB
export const convertVideoToSticker = (inputPath: string, outputPath: string) => {
    const command = createCommand(inputPath)
        .outputOptions([
            "-t", "3",
            "-an",
            "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=30",
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-b:v", "500k",
        ])

    return save(command, outputPath)
}
