import type { MetadataRoute } from "next"

import { languages } from "@/i18n/config"
import { getApiBaseUrl } from "@/lib/api-url"
import type { PageResponseProductListDTO } from "@/lib/api/model/pageResponseProductListDTO"
import { getLanguageAlternates, getLocalizedPath, getSiteUrl } from "@/lib/seo"

const publicRoutes = [
  { path: "", changeFrequency: "daily" as const, priority: 1 },
  { path: "/blogs", changeFrequency: "weekly" as const, priority: 0.7 },
  {
    path: "/book-demo",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    path: "/privacy-policy",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
]

function absoluteLanguageAlternates(path: string) {
  const siteUrl = getSiteUrl()
  return Object.fromEntries(
    Object.entries(getLanguageAlternates(path)).map(([language, url]) => [
      language,
      new URL(url, siteUrl).toString(),
    ])
  )
}

async function getActiveProductIds() {
  try {
    const params = new URLSearchParams({
      active: "true",
      page: "0",
      size: "1000",
      sort: "id,desc",
    })
    const response = await fetch(`${getApiBaseUrl()}/api/products?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return []
    const page = (await response.json()) as PageResponseProductListDTO
    return (page.content ?? [])
      .map((product) => product.id)
      .filter((id): id is number => id !== undefined)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const productIds = await getActiveProductIds()
  const staticEntries = publicRoutes.flatMap((route) =>
    languages.map((language) => ({
      url: new URL(getLocalizedPath(language, route.path), siteUrl).toString(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: absoluteLanguageAlternates(route.path) },
    }))
  )
  const productEntries = productIds.flatMap((productId) => {
    const productPath = `/products/${productId}`
    const reviewsPath = `${productPath}/reviews`

    return languages.flatMap((language) => [
      {
        url: new URL(
          getLocalizedPath(language, productPath),
          siteUrl
        ).toString(),
        changeFrequency: "daily" as const,
        priority: 0.9,
        alternates: { languages: absoluteLanguageAlternates(productPath) },
      },
      {
        url: new URL(
          getLocalizedPath(language, reviewsPath),
          siteUrl
        ).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: { languages: absoluteLanguageAlternates(reviewsPath) },
      },
    ])
  })

  return [...staticEntries, ...productEntries]
}
