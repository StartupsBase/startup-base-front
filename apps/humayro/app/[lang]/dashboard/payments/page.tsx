import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { requireDashboardPageAccess } from "@/lib/dashboard-auth"
import { createTranslatedPageMetadata } from "@/lib/seo"

import { PaymentsPage } from "./_components/payments-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return createTranslatedPageMetadata({
    language: lang,
    page: "payments",
    path: "/dashboard/payments",
    noIndex: true,
  })
}

export default async function PaymentsRoute({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  const user = await requireDashboardPageAccess({
    language: lang,
    page: "payments",
  })

  return <PaymentsPage language={lang} initialUser={user} />
}
