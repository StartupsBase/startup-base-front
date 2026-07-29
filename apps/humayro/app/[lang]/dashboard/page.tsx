import { notFound } from "next/navigation"

import { Dashboard } from "./_components/dashboard"
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
    page: "dashboard",
    path: "/dashboard",
    noIndex: true,
  })
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  await requireDashboardPageAccess({ language: lang, page: "dashboard" })

  return <Dashboard language={lang} />
}
