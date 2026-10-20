import { createCommand, save } from "./command";

const updateMetadata = (
    inputPath: string,
    outputPath: string,
    metadata: { title?: string; artist?: string; album?: string },
    coverImagePath?: string
) => {
    const command = createCommand(inputPath);

    if (metadata.title) command.outputOptions('-metadata', `title=${metadata.title}`);
    if (metadata.artist) command.outputOptions('-metadata', `artist=${metadata.artist}`);
    if (metadata.album) command.outputOptions('-metadata', `album=${metadata.album}`);

    if (coverImagePath) {
        command
            .input(coverImagePath)
            .outputOptions('-map', '0:a')
            .outputOptions('-map', '1:v')
            .outputOptions('-c', 'copy')
            .outputOptions('-c:v', 'mjpeg')
            .outputOptions('-disposition:v', 'attached_pic')
    } else {
        // copy every stream (including an existing cover) instead of re-encoding the audio
        command
            .outputOptions('-map', '0')
            .outputOptions('-c', 'copy')
    }

    return save(command, outputPath);
}

export default updateMetadata;
