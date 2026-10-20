import env from "@/config/env";
import { BotContext } from "@/types/context";
import { BotConversation } from "@/types/conversation";
import { removeFiles } from "@/utils/temp-files";
import { InputFile } from "grammy";
import sharp from "sharp";
import { remindBusy } from "../options";
import { processFile } from "../process-file";
import { getImage } from "./media";
import { parseSize } from "./parse-size";

const MAX_DIMENSION = 4096

export const resize = async (conv: BotConversation, ctx0: BotContext) => {
    const { file: photo, extension, name, size: photoSize } = getImage(ctx0)

    if (!photo) {
        await ctx0.reply(ctx0.t("error"))
        return
    }

    let current = photoSize

    // images sent as files don't report their size, so read it from the downloaded file
    if (!current) {
        const file = await ctx0.api.getFile(photo.file_id)
        const path = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${await conv.now()}-photo-size.${extension}`

        current = await conv.external(async () => {
            try {
                await file.download(path)
                const { width = 0, height = 0 } = await sharp(path).metadata()
                return { width, height }
            } finally {
                removeFiles([path])
            }
        })
    }

    await ctx0.reply(ctx0.t("photo-resize-prompt", { width: current.width, height: current.height }))

    const cpt1 = conv.checkpoint()

    const ctx1 = await conv.waitFor(":text", { otherwise: remindBusy })
    const size = parseSize(ctx1.message?.text ?? "", current)

    if (!size) {
        await ctx0.reply(ctx0.t("photo-resize-invalid"))
        await conv.rewind(cpt1)
    }

    if (size!.width > MAX_DIMENSION || size!.height > MAX_DIMENSION) {
        await ctx0.reply(ctx0.t("photo-resize-too-large", { max: MAX_DIMENSION }))
        await conv.rewind(cpt1)
    }

    await processFile(conv, ctx0, {
        fileId: photo.file_id,
        inputExtension: extension,
        outputExtension: extension,
        action: "resize",
        process: async (inputPath, outputPath) => {
            await sharp(inputPath).resize(size!.width, size!.height).toFile(outputPath)
        },
        send: (outputPath) => ctx0.replyWithDocument(new InputFile(outputPath, name ?? `resized-by-fileify.${extension}`)),
    })
}
