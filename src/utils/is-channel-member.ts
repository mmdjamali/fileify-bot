import type { ChatMember } from "grammy/types";

export const isChannelMember = (member: ChatMember) => {
    if (member.status === "restricted") return member.is_member;

    return ["creator", "administrator", "member"].includes(member.status);
};
