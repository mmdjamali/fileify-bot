import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "./context";

export type BotConversation = Conversation<BotContext, BotContext>;
