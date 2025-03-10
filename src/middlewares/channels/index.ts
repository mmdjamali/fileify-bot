import env from "@/config/env";
import { BotContext } from "@/types/context";
import { isChannelMember } from "@/utils/is-channel-member";
import { InlineKeyboard, NextFunction } from "grammy";
import { ChatMember } from "grammy/types";

const ChannelsMiddleware = async (ctx: BotContext, next: NextFunction) => {
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

            inlineKeyboard.url(`Channel ${idx + 1}`, `t.me/${env.CHANNELS[idx].slice(1)}`).row()
        }
    })

    if (isMemberToAll) return next()

    inlineKeyboard.text("Let's Go!", "check_membership")

    await ctx.reply("You must be a member of the following channels to use this bot\n", {
        reply_markup: inlineKeyboard,
    });

    return
};

export default ChannelsMiddleware;