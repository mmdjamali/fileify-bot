import { InlineKeyboard } from "grammy"

export const LANGUAGE_PROMPT = "Select your language (زبان خود را انتخاب کنید)"

export const languageKeyboard = () => new InlineKeyboard()
    .text("🇬🇧 English", "language:en")
    .text("🇮🇷 فارسی", "language:fa")
    .text("🇹🇷 Türkçe", "language:tr")
