import { expect, test } from "bun:test"
import { fileExtension } from "./file-extension"

test("uses a safe extension from the file name", () => {
    expect(fileExtension({ file_name: "song.MP3" }, "x")).toBe("mp3")
})

test("ignores unsafe or missing extensions and falls back to the mime type", () => {
    expect(fileExtension({ file_name: "a./../../evil", mime_type: "audio/mpeg" }, "x")).toBe("mp3")
    expect(fileExtension({ file_name: "noext", mime_type: "audio/ogg" }, "x")).toBe("ogg")
})

test("falls back to the default", () => {
    expect(fileExtension({}, "jpeg")).toBe("jpeg")
    expect(fileExtension({ mime_type: "application/zip" }, "jpeg")).toBe("jpeg")
})
