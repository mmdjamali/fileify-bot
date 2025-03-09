import type { Context, SessionFlavor } from "grammy";
import type { SessionData } from "./session";
import type { ConversationFlavor } from "@grammyjs/conversations";

export type BotContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;