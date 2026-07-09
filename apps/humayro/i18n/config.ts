export const languages = ["ru", "uz"] as const

export type Language = (typeof languages)[number]

export const defaultLanguage: Language = "ru"

export const languageCookieName = "NEXT_LOCALE"

export const languageLabels: Record<Language, string> = {
  ru: "Русский",
  uz: "O'zbek",
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
