import { Conversation } from "@grammyjs/conversations";
import { Context } from "grammy";
import { BotContext } from "./context";

export type BotConversation = Conversation<Context, BotContext>;