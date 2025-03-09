import { Bot, InlineKeyboard, session } from "grammy"
import { Reactions } from "@grammyjs/emoji"
import { Conversation, conversations, createConversation } from "@grammyjs/conversations"

import sleep from "@/utils/sleep"
import logger from "@/utils/logger"

import env from "@/config/env"

import { type BotContext } from "@/types/context"
import { type SessionData } from "@/types/session"


const main = async () => {
    const bot = new Bot<BotContext>(env.BOT_TOKEN)

    const initial = (): SessionData => {
        return {}
    }

    bot.use(session({ initial }))
    bot.use(conversations())

    const botName = await bot.api.getMyName()
    logger.info(`${botName.name} started`)
}

main()