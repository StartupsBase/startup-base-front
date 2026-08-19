import { notFound } from "next/navigation"

import { AnalyticsPage } from "./_components/analytics-page"
import { isLanguage } from "@/i18n/config"
import { requireDashboardPageAccess } from "@/lib/dashboard-auth"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return createTranslatedPageMetadata({
    language: lang,
    page: "analytics",
    path: "/dashboard/analytics",
    noIndex: true,
  })
}

export default async function AnalyticsRoute({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  const user = await requireDashboardPageAccess({
    language: lang,
    page: "analytics",
  })
  const { from, to } = getDefaultPeriod()

  return (
    <AnalyticsPage
      defaultFrom={from}
      defaultTo={to}
      initialUser={user}
      language={lang}
    />
  )
}

function getDefaultPeriod() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)

  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  }
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
