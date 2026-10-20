import { Bot, Context, session } from "grammy"
import { conversations } from "@grammyjs/conversations"
import { hydrateFiles } from "@grammyjs/files"
import { I18n } from "@grammyjs/i18n"
import path from "path"

import logger from "@/utils/logger"

import env from "@/config/env"

import { type BotContext } from "@/types/context"
import { type SessionData } from "@/types/session"

import { VIDEO_CONVERSATION_NAME, videoConversation } from "@/conversations/video"
import { AUDIO_CONVERSATION_NAME, audioConversation } from "@/conversations/audio"
import { PHOTO_CONVERSATION_NAME, photoConversation } from "@/conversations/photo"

import ChannelsMiddleware from "@/middlewares/channels"
import { getStats, redisStorage, trackUser } from "@/db/redis"
import { getMissingChannels, joinChannelsKeyboard } from "@/utils/channels"
import { LANGUAGE_PROMPT, languageKeyboard } from "@/utils/keyboards"
import { ensureDirs, sweepOldFiles } from "@/utils/temp-files"

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

    const sessionPlugin = session({
        initial,
        getSessionKey: (ctx: Context) => {
            if (ctx.from?.id) {
                return `user:${ctx.from?.id.toString()}`
            }

            return ctx.chatId ? `chat:${ctx.chatId.toString()}` : undefined
        },
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

    bot.use(async (ctx, next) => {
        if (ctx.from) trackUser(ctx.from.id)
        await next()
    })

    bot.use(sessionPlugin)
    bot.use(i18n)

    bot.use(conversations({
        plugins: [sessionPlugin, i18n]
    }))

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

    bot.callbackQuery(["language:fa", "language:en", "language:tr"], async (ctx) => {
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

    bot.on("message:video", ChannelsMiddleware, async (ctx) => {
        await ctx.react("🫡")

        await ctx.conversation.enter(VIDEO_CONVERSATION_NAME)
    })

    bot.on("message:animation", ChannelsMiddleware, async (ctx) => {
        await ctx.react("🫡")

        await ctx.conversation.enter(VIDEO_CONVERSATION_NAME)
    })

    bot.on("message:audio", ChannelsMiddleware, async (ctx) => {
        await ctx.react("🫡")

        await ctx.conversation.enter(AUDIO_CONVERSATION_NAME)
    })

    bot.on("message:photo", ChannelsMiddleware, async (ctx) => {
        await ctx.react("🫡")

        await ctx.conversation.enter(PHOTO_CONVERSATION_NAME)
    })

    bot.on("message:file", ChannelsMiddleware, async (ctx) => {
        const file = ctx.message?.document

        if (!file?.mime_type) {
            await ctx.reply(ctx.t("unsupported-file"))
            return
        }

        if (["image/jpeg", "image/png"].includes(file.mime_type)) {
            await ctx.react("🫡")

            await ctx.conversation.enter(PHOTO_CONVERSATION_NAME)
            return
        }

        if (["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv", "video/x-flv", "video/webm"].includes(file.mime_type)) {
            await ctx.react("🫡")

            await ctx.conversation.enter(VIDEO_CONVERSATION_NAME)
            return
        }

        if (["audio/mp3", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-flac", "audio/x-ms-wma"].includes(file.mime_type)) {
            await ctx.react("🫡")

            await ctx.conversation.enter(AUDIO_CONVERSATION_NAME)
            return
        }

        await ctx.reply(ctx.t("unsupported-file"))
    })





    bot.command("start", async (ctx) => {
        if (ctx.session.locale) {
            await ctx.reply(ctx.t("start"))
            return
        }

        await ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard() })
    })

    bot.command("language", async (ctx) => {
        await ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard() })
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

    bot.catch(async (err) => {
        if (err instanceof AggregateError) {
            err.errors.forEach((err) => {
                logger.error(err.message)
            })
        } else {
            logger.error(err.message)

            console.log(err)
        }
    })

    const botName = await bot.api.getMyName()
    logger.info(`${botName.name} started!`.toLocaleLowerCase())

    bot.start({
        drop_pending_updates: true
    })
}

main()
