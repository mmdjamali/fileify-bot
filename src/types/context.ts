import type { Context, SessionFlavor } from "grammy";
import type { SessionData } from "./session";
import type { ConversationFlavor } from "@grammyjs/conversations";
import { FileFlavor } from "@grammyjs/files";
import { I18nFlavor } from "@grammyjs/i18n";

export type BotContext = FileFlavor<ConversationFlavor<Context & SessionFlavor<SessionData> & I18nFlavor>>;