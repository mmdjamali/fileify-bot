import { expect, test } from "bun:test"
import type { ChatMember, User } from "grammy/types"
import { isChannelMember } from "./is-channel-member"

const user = { id: 1, is_bot: false, first_name: "test" } as User
const member = (fields: object) => ({ user, ...fields }) as ChatMember

test("members, admins and the creator count", () => {
    expect(isChannelMember(member({ status: "member" }))).toBe(true)
    expect(isChannelMember(member({ status: "administrator" }))).toBe(true)
    expect(isChannelMember(member({ status: "creator" }))).toBe(true)
})

test("left and banned users don't", () => {
    expect(isChannelMember(member({ status: "left" }))).toBe(false)
    expect(isChannelMember(member({ status: "kicked", until_date: 0 }))).toBe(false)
})

test("restricted users count only while still in the channel", () => {
    expect(isChannelMember(member({ status: "restricted", is_member: true }))).toBe(true)
    expect(isChannelMember(member({ status: "restricted", is_member: false }))).toBe(false)
})
