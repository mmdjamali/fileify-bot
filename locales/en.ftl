start = Hey! Got a file to tweak? Send a photo, video, GIF, audio file or voice message. /help

help =
    📁 Send me a file and pick what to do with it:

    🎥 Videos & GIFs: video note, GIF, video sticker, extract audio, remove audio
    🎵 Audio & voice: edit tags and cover, convert to voice message or MP3
    🖼 Photos: resize, make a sticker, convert to JPEG/PNG/WebP

    Files up to { $size } MB.
    /cancel stops the current task · /language changes the language

command-start = Start
command-help = Help and features
command-cancel = Cancel the current task
command-language = Change language

join-channels = You need to join the channels below to proceed.
check-join = I joined ✅
not-joined-yet = You haven't joined all the channels yet.

video = What would you like to do with this video?🤔
video-note = 📹 Video Note
video-too-long = Video must be less than 60 seconds
video-to-gif = 🎞 Convert to GIF
gif-too-long = Video must be less than { $seconds } seconds to convert to GIF
video-sticker = 🎭 Video Sticker
video-extract-audio = 🎵 Extract Audio
video-mute = 🔇 Remove Audio
no-audio = This video has no audio track.

audio = What would you like to do with this audio?🤔
audio-metadata = ✏️ Edit Metadata
audio-to-mp3 = 🎵 Convert to MP3
audio-new-title = What's the new title?
audio-new-artist = What's the new artist?
audio-new-album = What's the new album?
audio-new-cover = What's the new cover image?
audio-cover-invalid = Please send a JPEG or PNG image, or tap Skip.

photo = What would you like to do with this photo?🤔
photo-resize = 📐 Resize Image
photo-resize-prompt =
    📐 Current size: { $width }x{ $height }

    What dimensions would you like to resize it to?
    Reply with WIDTHxHEIGHT (like 512x512)
photo-resize-invalid = Invalid format, try again
photo-resize-too-large = Too large. Width and height must be at most { $max }px.


downloading = ⬇️ Downloading...
processing = 🔄 Processing...
uploading = ⬆️ Uploading to Telegram...
queued = ⏳ In queue (position { $position })...

cancel = ❌ Cancel
canceled = ❌ Canceled!
nothing-to-cancel = Nothing to cancel.
busy = You're already working on a file. Finish it or send /cancel.
skip = ⏩ Skip

error = Something went wrong, try again!
unsupported-file = Unsupported file type. Send a photo, video, GIF, or audio file.

file-size-error = File size must be less than { $size } MB