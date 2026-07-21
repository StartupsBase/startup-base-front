import type { Language } from "@/i18n/config"

import { FavouritesView } from "./_components/favourites-view"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "favourites",
    path: "/favourites",
    noIndex: true,
  })
}

export default async function FavouritesPage({
  params,
}: {
  params: Promise<{ lang: Language }>
}) {
  const { lang } = await params
  return <FavouritesView language={lang} />
}
