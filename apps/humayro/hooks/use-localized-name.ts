"use client"

import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import type { Language } from "@/i18n/config"

type LocalizedLanguage = Language | "en"

export type LocalizedNameSource = {
  name?: string | null
  nameEn?: string | null
  nameEng?: string | null
  nameRu?: string | null
  nameUz?: string | null
}

type UseLocalizedNameOptions = {
  defaultNameLanguage?: LocalizedLanguage
  fallback?: string
  language?: string
}

const languageFields: Record<
  LocalizedLanguage,
  Array<keyof LocalizedNameSource>
> = {
  en: ["nameEn", "nameEng"],
  ru: ["nameRu"],
  uz: ["nameUz"],
}

const supportedLanguages: LocalizedLanguage[] = ["ru", "uz", "en"]
const allNameFields: Array<keyof LocalizedNameSource> = [
  "name",
  "nameRu",
  "nameUz",
  "nameEn",
  "nameEng",
]

export function useLocalizedName({
  defaultNameLanguage = "uz",
  fallback = "—",
  language: languageOverride,
}: UseLocalizedNameOptions = {}) {
  const { i18n } = useTranslation()
  const language = normalizeLanguage(
    languageOverride ?? i18n.resolvedLanguage ?? i18n.language
  )
  const fieldPriority = useMemo(
    () => getFieldPriority(language, defaultNameLanguage),
    [defaultNameLanguage, language]
  )

  const getLocalizedName = useCallback(
    (source?: LocalizedNameSource | null, fallbackOverride = fallback) => {
      if (!source) return fallbackOverride

      for (const field of fieldPriority) {
        const value = source[field]?.trim()
        if (value) return value
      }

      return fallbackOverride
    },
    [fallback, fieldPriority]
  )

  const getLocalizedSearchValue = useCallback(
    (source?: LocalizedNameSource | null) => {
      if (!source) return ""

      return Array.from(
        new Set(
          allNameFields
            .map((field) => source[field]?.trim())
            .filter((value): value is string => Boolean(value))
        )
      ).join(" ")
    },
    []
  )

  return {
    getLocalizedName,
    getLocalizedSearchValue,
    language,
  }
}

function normalizeLanguage(language?: string): LocalizedLanguage {
  const normalized = language?.toLocaleLowerCase().split("-")[0]
  return normalized === "uz" || normalized === "en" ? normalized : "ru"
}

function getFieldPriority(
  language: LocalizedLanguage,
  defaultNameLanguage: LocalizedLanguage
) {
  const languagePriority = [
    language,
    defaultNameLanguage,
    ...supportedLanguages,
  ].filter(
    (item, index, items) => items.indexOf(item) === index
  ) as LocalizedLanguage[]

  return languagePriority.flatMap((item) => [
    ...languageFields[item],
    ...(item === defaultNameLanguage
      ? (["name"] as Array<keyof LocalizedNameSource>)
      : []),
  ])
}
