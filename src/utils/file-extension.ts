const MIME_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-flac": "flac",
    "audio/flac": "flac",
    "audio/x-ms-wma": "wma",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
}

// file_name is user-controlled, so only trust a short alphanumeric extension from it
export const fileExtension = (file: { file_name?: string, mime_type?: string }, fallback: string) => {
    const fromName = file.file_name?.includes(".") ? file.file_name.split(".").at(-1) : undefined

    if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase()

    return (file.mime_type && MIME_EXTENSIONS[file.mime_type]) || fallback
}
