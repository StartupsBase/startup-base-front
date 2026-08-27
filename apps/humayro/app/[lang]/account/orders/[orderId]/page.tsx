import { notFound } from "next/navigation"

import { AccountOrderDetailsView } from "@/components/order-details-view"
import { isLanguage } from "@/i18n/config"

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ lang: string; orderId: string }>
}) {
  const { lang, orderId: rawOrderId } = await params
  const orderId = Number(rawOrderId)

  if (!isLanguage(lang) || !Number.isSafeInteger(orderId) || orderId <= 0) {
    notFound()
  }

  return <AccountOrderDetailsView language={lang} orderId={orderId} />
}
