import { Bot, session } from "grammy"
import { conversations } from "@grammyjs/conversations"

import logger from "@/utils/logger"

import env from "@/config/env"

import { type BotContext } from "@/types/context"
import { type SessionData } from "@/types/session"
import { hydrateFiles } from "@grammyjs/files"


const main = async () => {
    const bot = new Bot<BotContext>(env.BOT_TOKEN)

    bot.api.config.use(hydrateFiles(env.BOT_TOKEN))

    const initial = (): SessionData => {
        return {}
    }

    bot.use(session({ initial }))
    bot.use(conversations())

    bot.on(":video", async (ctx) => {
        await ctx.reply("👍")

        const file = await ctx.getFile()

        console.log(file)

        const path = await file.download("./temp.mp4")

        console.log(path)
    })

    bot.command("start", async (ctx) => {
        await ctx.reply("Hello!")
    })

    const botName = await bot.api.getMyName()
    logger.info(`${botName.name} started`)

    bot.start()
}

main()