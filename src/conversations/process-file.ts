import env from "@/config/env"
import { recordJob } from "@/db/redis"
import { BotContext } from "@/types/context"
import { BotConversation } from "@/types/conversation"
import { JobQueue } from "@/utils/job-queue"
import logger from "@/utils/logger"
import { removeFiles } from "@/utils/temp-files"
import { Api } from "grammy"
import type { Message } from "grammy/types"

export const jobQueue = new JobQueue(env.MAX_CONCURRENT_JOBS)

// status updates from inside a running job bypass the conversation's api interception
const api = new Api(env.BOT_TOKEN)

export const userLabel = (ctx: BotContext) => {
    return `${ctx.from?.id} => ${[ctx.from?.first_name, ctx.from?.last_name].filter(v => !!v).join(" ")}`
}

export const reportError = async (ctx: BotContext, err: unknown, statusMessage: Message.TextMessage | null) => {
    logger.error(`${ctx.from?.id} => ${err instanceof Error && err.message ? err.message : err}`)

    try {
        if (statusMessage) await ctx.api.editMessageText(ctx.chat!.id, statusMessage.message_id, ctx.t("error"))
        else await ctx.reply(ctx.t("error"))
    } catch { }
}

type ProcessFileOptions = {
    fileId: string
    inputExtension: string
    outputExtension: string
    // short name used for logs and /stats
    action: string
    // returns an error message to show instead of processing
    validate?: (inputPath: string) => Promise<string | undefined>
    process: (inputPath: string, outputPath: string) => Promise<void>
    send: (outputPath: string) => Promise<unknown>
    // extra temp files created by process
    cleanup?: string[]
}

// download → (queue) → process → upload, with status messages and temp file cleanup
export const processFile = async (conversation: BotConversation, ctx: BotContext, options: ProcessFileOptions) => {
    const chatId = ctx.chat!.id
    const paths = [...(options.cleanup ?? [])]

    let status: Message.TextMessage | null = null

    try {
        const file = await ctx.api.getFile(options.fileId)
        const stamp = await conversation.now()

        const inputPath = `${env.DOWNLOAD_DIR}/${file.file_unique_id}-${stamp}-${options.action}.${options.inputExtension}`
        const outputPath = `${env.PROCESSED_DIR}/${file.file_unique_id}-${stamp}-${options.action}.${options.outputExtension}`
        paths.push(inputPath, outputPath)

        status = await ctx.reply(ctx.t("downloading"))
        const statusId = status.message_id

        await conversation.external(() => file.download(inputPath))

        if (options.validate) {
            const problem = await conversation.external(() => options.validate!(inputPath))

            if (problem) {
                await ctx.api.editMessageText(chatId, statusId, problem)
                return
            }
        }

        await ctx.api.editMessageText(chatId, statusId, ctx.t("processing"))

        const processing = ctx.t("processing")
        const queued = (position: number) => ctx.t("queued", { position })
        let wasQueued = false

        await conversation.external(() => jobQueue.run(
            async () => {
                if (wasQueued) await api.editMessageText(chatId, statusId, processing).catch(() => { })
                await options.process(inputPath, outputPath)
            },
            async (position) => {
                wasQueued = true
                await api.editMessageText(chatId, statusId, queued(position))
            },
        ))

        await ctx.api.editMessageText(chatId, statusId, ctx.t("uploading"))
        await options.send(outputPath)
        await ctx.api.deleteMessage(chatId, statusId)

        await conversation.external(() => {
            logger.info(`${userLabel(ctx)} ${options.action}`)
            recordJob(options.action)
        })
    } catch (err) {
        await reportError(ctx, err, status)
    } finally {
        removeFiles(paths)
    }
}
