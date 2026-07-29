import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { requireDashboardPageAccess } from "@/lib/dashboard-auth"
import { createTranslatedPageMetadata } from "@/lib/seo"

import { OrdersView } from "./_components/orders-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return createTranslatedPageMetadata({
    language: lang,
    page: "orders",
    path: "/dashboard/orders",
    noIndex: true,
  })
}

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) {
    notFound()
  }

  await requireDashboardPageAccess({ language: lang, page: "orders" })

  return <OrdersView language={lang} />
}
