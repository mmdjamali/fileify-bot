import { Bot, Context, InlineKeyboard, session } from "grammy"
import { conversations } from "@grammyjs/conversations"
import { hydrateFiles } from "@grammyjs/files"

import logger from "@/utils/logger"

import env from "@/config/env"

import { type BotContext } from "@/types/context"
import { type SessionData } from "@/types/session"

import { VIDEO_CONVERSATION_NAME, videoConversation } from "@/conversations/video"
import { AUDIO_CONVERSATION_NAME, audioConversation } from "@/conversations/audio"
import { PHOTO_CONVERSATION_NAME, photoConversation } from "@/conversations/photo"

import ChannelsMiddleware from "@/middlewares/channels"
import { ChatMember } from "grammy/types"
import { isChannelMember } from "@/utils/is-channel-member"
import { I18n } from "@grammyjs/i18n"
import path from "path"
import { redisStorage } from "@/db/redis"
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

    bot.use(sessionPlugin)
    bot.use(i18n)

    bot.use(conversations({
        plugins: [sessionPlugin, i18n]
    }))

    bot.callbackQuery("check_membership", async (ctx) => {
        await ctx.answerCallbackQuery()

        const channels = await Promise.all<ChatMember | null>(
            env.CHANNELS.map((channel) => ctx.api.getChatMember(channel, ctx.from!.id).catch(() => null))
        )

        let isMemberToAll = true;

        channels.forEach((member, idx) => {
            if (member) {
                const isMember = isChannelMember(member);
                isMemberToAll = isMemberToAll && isMember

                if (isMember || !env.CHANNELS[idx]) return
            }
        })

        if (!isMemberToAll) return

        await Promise.all(
            [
                ctx.api.deleteMessage(ctx.chat!.id, ctx.callbackQuery.message!.message_id),
                ctx.reply(ctx.t("start"))
            ]
        )
    })

    bot.callbackQuery(["language:fa", "language:en", "language:tr"], async (ctx) => {
        await ctx.answerCallbackQuery()

        const locale = ctx.callbackQuery.data.split(":")[1]

        ctx.session.locale = locale
        await ctx.i18n.renegotiateLocale()

        await ctx.api.deleteMessage(ctx.chat!.id, ctx.callbackQuery.message!.message_id)

        const channels = await Promise.all<ChatMember | null>(
            env.CHANNELS.map((channel) => ctx.api.getChatMember(channel, ctx.from!.id).catch(() => null))
        )

        let isMemberToAll = true;

        const inlineKeyboard = new InlineKeyboard()

        channels.forEach((member, idx) => {
            if (member) {
                const isMember = isChannelMember(member);
                isMemberToAll = isMemberToAll && isMember

                if (isMember || !env.CHANNELS[idx]) return

                inlineKeyboard.url(env.CHANNELS[idx], `t.me/${env.CHANNELS[idx].slice(1)}`).row()
            }
        })

        if (isMemberToAll) {
            await ctx.reply(ctx.t("start"))
            return
        }

        inlineKeyboard.text(ctx.t("check-join"), "check_membership")

        await ctx.reply(ctx.t("join-channels"), {
            reply_markup: inlineKeyboard,
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

        const inlineKeyboard = new InlineKeyboard()
            .text("🇬🇧 English", "language:en")
            .text("🇮🇷 فارسی", "language:fa")
            .text("🇹🇷 Türkçe", "language:tr")

        await ctx.reply("Select your language (زبان خود را انتخاب کنید)", { reply_markup: inlineKeyboard })
    })

    bot.command("language", async (ctx) => {
        const inlineKeyboard = new InlineKeyboard()
            .text("🇬🇧 English", "language:en")
            .text("🇮🇷 فارسی", "language:fa")
            .text("🇹🇷 Türkçe", "language:tr")

        await ctx.reply("Select your language (زبان خود را انتخاب کنید)", { reply_markup: inlineKeyboard })
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