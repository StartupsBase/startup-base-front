import type { Language } from "@/i18n/config"

import { CartView } from "./_components/cart-view"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "cart",
    path: "/cart",
    noIndex: true,
  })
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ lang: Language }>
}) {
  const { lang } = await params
  return <CartView language={lang} />
}
