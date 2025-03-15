import Ffmpeg from "fluent-ffmpeg";

const updateMetadata = async (
    inputPath: string,
    outputPath: string,
    metadata: { title?: string; artist?: string; album?: string },
    coverImagePath?: string
) => {
    return new Promise((resolve, reject) => {
        const command = Ffmpeg(inputPath);

        if (metadata.title) command.outputOptions('-metadata', `title=${metadata.title}`);
        if (metadata.artist) command.outputOptions('-metadata', `artist=${metadata.artist}`);
        if (metadata.album) command.outputOptions('-metadata', `album=${metadata.album}`);

        if (coverImagePath) {
            command
                .input(coverImagePath)
                .outputOptions('-map', '0')
                .outputOptions('-map', '1:v')
                .outputOptions('-map', '-0:v')
                .outputOptions('-c', 'copy')
                .outputOptions('-c:v', 'mjpeg')
                .outputOptions('-disposition:v', 'attached_pic')
        }

        command
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
}

export default updateMetadata;