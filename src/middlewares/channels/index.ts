import { BotContext } from "@/types/context";
import { getMissingChannels, joinChannelsKeyboard } from "@/utils/channels";
import { LANGUAGE_PROMPT, languageKeyboard } from "@/utils/keyboards";
import { NextFunction } from "grammy";

const ChannelsMiddleware = async (ctx: BotContext, next: NextFunction) => {
    if (!ctx.session.locale) {
        await ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard() })
        return
    }

    const missing = await getMissingChannels(ctx.api, ctx.from!.id)

    if (missing.length === 0) return next()

    await ctx.reply(ctx.t("join-channels"), {
        reply_markup: joinChannelsKeyboard(ctx, missing),
    });
};

export default ChannelsMiddleware;
