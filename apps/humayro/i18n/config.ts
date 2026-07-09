export const languages = ["ru", "uz"] as const

export type Language = (typeof languages)[number]

export const defaultLanguage: Language = "ru"

export const languageCookieName = "NEXT_LOCALE"

export const languageLabels: Record<Language, string> = {
  ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  uz: "O'zbek",
}

export const languageShortLabels: Record<Language, string> = {
  ru: "RU",
  uz: "UZ",
}

export const languageFlags: Record<Language, string> = {
  ru: "\ud83c\uddf7\ud83c\uddfa",
  uz: "\ud83c\uddfa\ud83c\uddff",
}

export function isLanguage(value: unknown): value is Language {
  if (typeof value !== "string") {
    return false
  }

  return languages.includes(value as Language)
}

export function getLanguage(value: string | undefined | null): Language {
  if (!value) {
    return defaultLanguage
  }

  const normalized = value.toLowerCase().split("-")[0] ?? value.toLowerCase()

  return isLanguage(normalized) ? normalized : defaultLanguage
}
