import type { Language } from "@/i18n/config"

import { OrdersView } from "./_components/orders-view"

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: Language }>
}) {
  const { lang } = await params
  return <OrdersView language={lang} />
}
