import env from "@/config/env";
import { BotContext } from "@/types/context";
import { isChannelMember } from "@/utils/is-channel-member";
import { InlineKeyboard, NextFunction } from "grammy";
import { ChatMember } from "grammy/types";

const ChannelsMiddleware = async (ctx: BotContext, next: NextFunction) => {
    if (!ctx.session.locale) {
        const inlineKeyboard = new InlineKeyboard()
            .text("🇬🇧 English", "language:en")
            .text("🇮🇷 فارسی", "language:fa")
            .text("🇹🇷 Türkçe", "language:tr")

        await ctx.reply("Select your language (زبان خود را انتخاب کنید)", { reply_markup: inlineKeyboard })

        return
    }

    if (env.CHANNELS.length === 0) {
        return next();
    }

    const channels = await Promise.all<ChatMember | null>(
        env.CHANNELS.map((channel) => ctx.api.getChatMember(channel, ctx.from!.id).catch(() => null))
    )

    let isMemberToAll = true;

    const inlineKeyboard = new InlineKeyboard()

    channels.forEach((member, idx) => {
        if (member) {
            const isMember = isChannelMember(member.status);
            isMemberToAll = isMemberToAll && isMember

            if (isMember || !env.CHANNELS[idx]) return

            inlineKeyboard.url(env.CHANNELS[idx], `t.me/${env.CHANNELS[idx].slice(1)}`).row()
        }
    })

    if (isMemberToAll) return next()

    inlineKeyboard.text(ctx.t("check-join"), "check_membership")

    await ctx.reply(ctx.t("join-channels"), {
        reply_markup: inlineKeyboard,
    });

    return
};

export default ChannelsMiddleware;