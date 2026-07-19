import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://humayro.uz"
const languages = ["uz", "ru"] as const
const routes = ["", "/blogs", "/book-demo", "/privacy-policy"]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    languages.map((language) => ({
      url: `${siteUrl}/${language}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : route === "/blogs" ? 0.8 : 0.6,
      alternates: {
        languages: {
          uz: `${siteUrl}/uz${route}`,
          ru: `${siteUrl}/ru${route}`,
          "x-default": `${siteUrl}/uz${route}`,
        },
      },
    }))
  )
}
