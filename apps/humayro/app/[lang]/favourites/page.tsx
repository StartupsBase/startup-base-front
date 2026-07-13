import type { Language } from "@/i18n/config"

import { FavouritesView } from "./_components/favourites-view"

export default async function FavouritesPage({
  params,
}: {
  params: Promise<{ lang: Language }>
}) {
  const { lang } = await params
  return <FavouritesView language={lang} />
}
