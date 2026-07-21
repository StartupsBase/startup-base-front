import type { Language } from "@/i18n/config"

import { OrdersView } from "./_components/orders-view"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "orders",
    path: "/orders",
    noIndex: true,
  })
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: Language }>
}) {
  const { lang } = await params
  return <OrdersView language={lang} />
}
