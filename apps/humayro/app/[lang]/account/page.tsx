import { notFound } from "next/navigation"

import { OrdersView } from "../orders/_components/orders-view"
import { isLanguage } from "@/i18n/config"

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) {
    notFound()
  }

  return <OrdersView language={lang} />
}
