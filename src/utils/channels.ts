import env from "@/config/env";
import { BotContext } from "@/types/context";
import { isChannelMember } from "@/utils/is-channel-member";
import { Api, InlineKeyboard } from "grammy";

// channels we can't check (e.g. the bot isn't an admin there) are not counted as missing
export const getMissingChannels = async (api: Api, userId: number) => {
    const members = await Promise.all(
        env.CHANNELS.map((channel) => api.getChatMember(channel, userId).catch(() => null))
    )

    return env.CHANNELS.filter((_, idx) => {
        const member = members[idx]
        return member !== null && !isChannelMember(member)
    })
}

export const joinChannelsKeyboard = (ctx: BotContext, channels: string[]) => {
    const keyboard = new InlineKeyboard()

    channels.forEach((channel) => keyboard.url(channel, `t.me/${channel.slice(1)}`).row())

    return keyboard.text(ctx.t("check-join"), "check_membership")
}
