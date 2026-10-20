<p align="center"><img align="center" width="140" src="./.github/logo.svg"/></p>
<p align="center">
  <img src="https://skillicons.dev/icons?i=ts" />
  <br/>
  <a href="https://t.me/fileifybot"><kbd>🔵 bot</kbd></a>
</p>

<br/><br/>

# 📁 Fileify

Open-source Telegram bot for editing and optimizing media — files, videos, audio, and images.

## ✨ Features

Send the bot a file and pick an action:

- 🎥 **Videos & GIFs** – convert to a circle video note, GIF, or video sticker; extract the audio as MP3; remove the audio
- 🎵 **Audio & voice messages** – edit title, artist, album and cover art; convert to a voice message or MP3
- 🖼 **Photos** – resize (exact size, one side to keep the aspect ratio, or a percentage); make a sticker; convert to JPEG, PNG or WebP
- 🌍 English, فارسی and Türkçe
- ⏳ Heavy work runs through a job queue, so a busy bot shows your place in line instead of freezing

Commands: `/start`, `/help`, `/cancel`, `/language`, and `/stats` for admins.

## 🚀 Running

```sh
cp .env.example .env   # set BOT_TOKEN at least
docker compose up -d
```

For development you need Node, pnpm, ffmpeg and a Redis instance:

```sh
pnpm install
pnpm dev        # run with reload
pnpm typecheck
pnpm test       # unit tests, run with bun
```

## ⚙️ Configuration

| Variable | Default | |
| --- | --- | --- |
| `BOT_TOKEN` | – | Token from [@BotFather](https://t.me/BotFather) |
| `REDIS_URL` | – | Sessions and usage stats |
| `CHANNELS` | – | Comma-separated channels users must join first |
| `ADMIN_IDS` | – | Comma-separated user ids allowed to use `/stats` |
| `MAX_FILE_SIZE_MB` | `20` | Largest file accepted |
| `MAX_CONCURRENT_JOBS` | `2` | ffmpeg/sharp jobs running at once; the rest wait in a queue |
| `JOB_TIMEOUT_SECONDS` | `300` | ffmpeg is killed after this long |
| `DOWNLOAD_DIR`, `PROCESSED_DIR` | `./downloads`, `./processed` | Temporary files, swept hourly |
| `BOT_API_ROOT` | Telegram's | URL of a self-hosted Bot API server |

### Files larger than 20 MB

Telegram's public Bot API only lets bots download files up to 20 MB. A [self-hosted Bot API server](https://github.com/tdlib/telegram-bot-api) raises that to 2 GB:

1. Get an API id and hash from [my.telegram.org](https://my.telegram.org) and set `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` in `.env`.
2. Log the bot out of the public API once: `curl https://api.telegram.org/bot<BOT_TOKEN>/logOut`.
3. Set `BOT_API_ROOT=http://telegram-bot-api:8081` and `MAX_FILE_SIZE_MB=2000`.
4. `docker compose --profile local-api up -d`
