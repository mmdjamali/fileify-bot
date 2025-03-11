import { Bot, Context, InlineKeyboard, InputFile, session } from "grammy"
import { Conversation, conversations } from "@grammyjs/conversations"
import { hydrateFiles } from "@grammyjs/files"

import ffmpeg from "fluent-ffmpeg"

import logger from "@/utils/logger"

import env from "@/config/env"

import { unlinkSync } from "fs"

import { type BotContext } from "@/types/context"
import { type SessionData } from "@/types/session"

import { convertVideoToSquare } from "@/pkg/ffmpeg"
import { VIDEO_CONVIRATION_NAME, videoConversation } from "@/conversations/video"
import ChannelsMiddleware from "./middlewares/channels"
import { ChatMember } from "grammy/types"
import { isChannelMember } from "./utils/is-channel-member"
import { I18n } from "@grammyjs/i18n"
import path from "path"

const main = async () => {
    const bot = new Bot<BotContext>(env.BOT_TOKEN)

    bot.api.config.use(hydrateFiles(env.BOT_TOKEN))

    const initial = (): SessionData => {
        return {
            locale: ""
        }
    }

    const sessionPlugin = session({ initial, getSessionKey: (ctx: Context) => ctx.from?.id.toString() })

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
                const isMember = isChannelMember(member.status);
                isMemberToAll = isMemberToAll && isMember

                if (isMember || !env.CHANNELS[idx]) return
            }
        })

        await ctx.answerCallbackQuery()

        if (!isMemberToAll) return

        await ctx.api.deleteMessage(ctx.chat!.id, ctx.callbackQuery.message!.message_id)

        await ctx.reply(`🎉 Thanks for joining! \nYou're all set to explore. \n\nNeed help? Just type /start anytime! 😊`)
    })
    bot.use(ChannelsMiddleware)

    bot.use(videoConversation)

    bot.on(":video", async (ctx) => {
        await ctx.react("🫡")

        await ctx.conversation.enter(VIDEO_CONVIRATION_NAME)
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

    bot.callbackQuery(["language:fa", "language:en", "language:tr"], async (ctx) => {
        await ctx.answerCallbackQuery()

        const locale = ctx.callbackQuery.data.split(":")[1]

        ctx.session.locale = locale
        await ctx.i18n.renegotiateLocale()

        await ctx.api.deleteMessage(ctx.chat!.id, ctx.callbackQuery.message!.message_id)

        await ctx.reply(ctx.t("start"))
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