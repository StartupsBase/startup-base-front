import { notFound } from "next/navigation"

import { AdminOrderDetailsView } from "@/components/order-details-view"
import { isLanguage } from "@/i18n/config"
import { requireDashboardPageAccess } from "@/lib/dashboard-auth"

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ lang: string; orderId: string }>
}) {
  const { lang, orderId: rawOrderId } = await params
  const orderId = Number(rawOrderId)

  if (!isLanguage(lang) || !Number.isSafeInteger(orderId) || orderId <= 0) {
    notFound()
  }

  await requireDashboardPageAccess({ language: lang, page: "orders" })

  return <AdminOrderDetailsView language={lang} orderId={orderId} />
}
