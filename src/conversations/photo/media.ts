import { BotContext } from "@/types/context"
import { fileExtension } from "@/utils/file-extension"

// largest size of a photo, or an image sent as a file
export const getImage = (ctx: BotContext) => {
    const photo = ctx.message?.photo?.at(-1)

    if (photo) return { file: photo, extension: "jpeg", name: undefined, size: { width: photo.width, height: photo.height } }

    const document = ctx.message?.document

    return { file: document, extension: document ? fileExtension(document, "jpeg") : "jpeg", name: document?.file_name, size: undefined }
}
