import type { Metadata } from "next"

import { isLanguage, languages, type Language } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"

const FALLBACK_SITE_URL = "https://humayro.uz"
const DEFAULT_SOCIAL_IMAGE = "/brand/humayroLight.png"

export const seoPages = [
  "home",
  "blogs",
  "bookDemo",
  "cart",
  "favourites",
  "orders",
  "payments",
  "privacy",
  "login",
  "register",
  "forgotPassword",
  "resetPassword",
  "googleCallback",
  "dashboard",
  "administration",
  "addresses",
  "organizations",
  "organization",
  "newProduct",
  "editProduct",
  "profile",
] as const

export type SeoPage = (typeof seoPages)[number]

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  try {
    const url = new URL(configured || FALLBACK_SITE_URL)
    return url.protocol === "https:" || url.protocol === "http:"
      ? url
      : new URL(FALLBACK_SITE_URL)
  } catch {
    return new URL(FALLBACK_SITE_URL)
  }
}

export function getLocalizedPath(language: Language, path = "") {
  const normalizedPath =
    path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`
  return `/${language}${normalizedPath}`
}

export function getLanguageAlternates(path = "") {
  return Object.fromEntries(
    languages.map((language) => [language, getLocalizedPath(language, path)])
  )
}

export function createPageMetadata({
  description,
  images,
  keywords,
  language,
  noIndex = false,
  path = "",
  title,
}: {
  description: string
  images?: string[]
  keywords?: string[]
  language: Language
  noIndex?: boolean
  path?: string
  title: string
}): Metadata {
  const canonical = getLocalizedPath(language, path)
  const socialTitle = title === "Humayro" ? title : `${title} | Humayro`
  const socialImages = images?.length ? images : [DEFAULT_SOCIAL_IMAGE]

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ...getLanguageAlternates(path),
        "x-default": getLocalizedPath("ru", path),
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Humayro",
      title: socialTitle,
      description,
      locale: language === "ru" ? "ru_RU" : "uz_UZ",
      alternateLocale: language === "ru" ? ["uz_UZ"] : ["ru_RU"],
      images: socialImages,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: socialImages,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          noarchive: true,
          noimageindex: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  }
}

export async function createTranslatedPageMetadata({
  language,
  noIndex,
  page,
  path,
}: {
  language: string
  noIndex?: boolean
  page: SeoPage
  path?: string
}): Promise<Metadata> {
  if (!isLanguage(language)) return {}

  const { t } = await getTranslation(language)

  return createPageMetadata({
    language,
    path,
    noIndex,
    title: t(`seo.pages.${page}.title`),
    description: t(`seo.pages.${page}.description`),
  })
}
