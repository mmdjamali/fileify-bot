import { Bot, Context, session } from "grammy"
import { conversations } from "@grammyjs/conversations"
import { hydrateFiles } from "@grammyjs/files"
import { I18n } from "@grammyjs/i18n"
import { limit } from "@grammyjs/ratelimiter"
import { run, sequentialize } from "@grammyjs/runner"
import path from "path"

import logger from "@/utils/logger"

import env from "@/config/env"

import { type BotContext } from "@/types/context"
import { type SessionData } from "@/types/session"

import { VIDEO_CONVERSATION_NAME, videoConversation } from "@/conversations/video"
import { AUDIO_CONVERSATION_NAME, audioConversation } from "@/conversations/audio"
import { PHOTO_CONVERSATION_NAME, photoConversation } from "@/conversations/photo"

import ChannelsMiddleware from "@/middlewares/channels"
import redis, { getStats, redisStorage, trackUser } from "@/db/redis"
import { getMissingChannels, joinChannelsKeyboard } from "@/utils/channels"
import { LANGUAGE_PROMPT, languageKeyboard } from "@/utils/keyboards"
import { ensureDirs, sweepOldFiles } from "@/utils/temp-files"

const LOCALES = ["en", "fa", "tr"] as const

const IMAGE_TYPES = ["image/jpeg", "image/png"]
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv", "video/x-flv", "video/webm"]
const AUDIO_TYPES = ["audio/mp3", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-flac", "audio/x-ms-wma"]

const TEMP_FILE_MAX_AGE = 60 * 60 * 1000

const main = async () => {
    const tempDirs = [env.DOWNLOAD_DIR, env.PROCESSED_DIR]

    ensureDirs(tempDirs)
    sweepOldFiles(tempDirs, 0)
    setInterval(() => sweepOldFiles(tempDirs, TEMP_FILE_MAX_AGE), TEMP_FILE_MAX_AGE / 2).unref()

    const bot = new Bot<BotContext>(env.BOT_TOKEN)

    bot.api.config.use(hydrateFiles(env.BOT_TOKEN))

    const initial = (): SessionData => {
        return {
            locale: ""
        }
    }

    const getSessionKey = (ctx: Context) => {
        if (ctx.from?.id) {
            return `user:${ctx.from?.id.toString()}`
        }

        return ctx.chatId ? `chat:${ctx.chatId.toString()}` : undefined
    }

    const sessionPlugin = session({
        initial,
        getSessionKey,
        storage: redisStorage,
    })

    const i18n = new I18n<BotContext>({
        directory: path.join(__dirname, "../locales"),
        defaultLocale: "en",
        useSession: true,
        localeNegotiator: async (ctx) => {
            const locale = ctx.session.locale
            return locale
        }
    })

    // updates run concurrently, but each user's updates stay in order
    bot.use(sequentialize(getSessionKey))

    bot.use(limit({
        timeFrame: 2000,
        limit: 3,
        keyGenerator: (ctx) => ctx.from?.id.toString(),
    }))

    bot.use(async (ctx, next) => {
        if (ctx.from) trackUser(ctx.from.id)
        await next()
    })

    bot.use(sessionPlugin)
    bot.use(i18n)

    bot.use(conversations({
        plugins: [sessionPlugin, i18n]
    }))

    // commands and buttons are registered before the conversations so a waiting prompt can't swallow them
    bot.command("start", async (ctx) => {
        if (ctx.session.locale) {
            await ctx.reply(ctx.t("start"))
            return
        }

        await ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard() })
    })

    bot.command("help", async (ctx) => {
        await ctx.reply(ctx.t("help", { size: env.MAX_FILE_SIZE_MB }))
    })

    bot.command("language", async (ctx) => {
        await ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard() })
    })

    bot.command("cancel", async (ctx) => {
        if (Object.keys(ctx.conversation.active()).length === 0) {
            await ctx.reply(ctx.t("nothing-to-cancel"))
            return
        }

        await ctx.conversation.exitAll()
        await ctx.reply(ctx.t("canceled"))
    })

    bot.command("stats", async (ctx) => {
        if (!ctx.from || !env.ADMIN_IDS.includes(ctx.from.id)) return

        const { users, jobs } = await getStats()
        const total = jobs.reduce((sum, job) => sum + job.count, 0)
        const breakdown = jobs
            .sort((a, b) => b.count - a.count)
            .map((job) => `• ${job.action}: ${job.count}`)
            .join("\n")

        await ctx.reply(`👥 ${users}\n⚙️ ${total}\n\n${breakdown}`.trim())
    })

    bot.callbackQuery("check_membership", async (ctx) => {
        const missing = await getMissingChannels(ctx.api, ctx.from.id)

        if (missing.length > 0) {
            await ctx.answerCallbackQuery({ text: ctx.t("not-joined-yet"), show_alert: true })
            return
        }

        await ctx.answerCallbackQuery()

        await Promise.all(
            [
                ctx.deleteMessage(),
                ctx.reply(ctx.t("start"))
            ]
        )
    })

    bot.callbackQuery(LOCALES.map((locale) => `language:${locale}`), async (ctx) => {
        await ctx.answerCallbackQuery()

        const locale = ctx.callbackQuery.data.split(":")[1]

        ctx.session.locale = locale
        await ctx.i18n.renegotiateLocale()

        await ctx.deleteMessage()

        const missing = await getMissingChannels(ctx.api, ctx.from.id)

        if (missing.length === 0) {
            await ctx.reply(ctx.t("start"))
            return
        }

        await ctx.reply(ctx.t("join-channels"), {
            reply_markup: joinChannelsKeyboard(ctx, missing),
        });
    })

    bot.use(videoConversation)
    bot.use(audioConversation)
    bot.use(photoConversation)

    // while a conversation is waiting it swallows new messages, so these only run when the user is free
    const enter = (name: string) => async (ctx: BotContext) => {
        await ctx.react("🫡")

        await ctx.conversation.enter(name)
    }

    bot.on(["message:video", "message:animation", "message:video_note"], ChannelsMiddleware, enter(VIDEO_CONVERSATION_NAME))
    bot.on("message:audio", ChannelsMiddleware, enter(AUDIO_CONVERSATION_NAME))
    bot.on("message:photo", ChannelsMiddleware, enter(PHOTO_CONVERSATION_NAME))

    bot.on("message:file", ChannelsMiddleware, async (ctx) => {
        const mimeType = ctx.message?.document?.mime_type ?? ""

        if (IMAGE_TYPES.includes(mimeType)) return enter(PHOTO_CONVERSATION_NAME)(ctx)
        if (VIDEO_TYPES.includes(mimeType)) return enter(VIDEO_CONVERSATION_NAME)(ctx)
        if (AUDIO_TYPES.includes(mimeType)) return enter(AUDIO_CONVERSATION_NAME)(ctx)

        await ctx.reply(ctx.t("unsupported-file"))
    })

    bot.catch(async (err) => {
        if (err.error instanceof AggregateError) {
            err.error.errors.forEach((err) => {
                logger.error(err.message)
            })
        } else {
            logger.error(err.message)

            console.log(err)
        }

        try {
            await err.ctx.reply(err.ctx.t("error"))
        } catch { }
    })

    for (const locale of LOCALES) {
        const t = (key: string) => i18n.t(locale, key)

        await bot.api.setMyCommands([
            { command: "start", description: t("command-start") },
            { command: "help", description: t("command-help") },
            { command: "cancel", description: t("command-cancel") },
            { command: "language", description: t("command-language") },
        ], locale === "en" ? {} : { language_code: locale })
    }

    await bot.api.deleteWebhook({ drop_pending_updates: true })

    const botName = await bot.api.getMyName()
    logger.info(`${botName.name} started!`.toLocaleLowerCase())

    const runner = run(bot)

    const stop = async () => {
        logger.info("stopping...")

        if (runner.isRunning()) await runner.stop()
        await redis.quit()
    }

    process.once("SIGINT", stop)
    process.once("SIGTERM", stop)
}

main()
