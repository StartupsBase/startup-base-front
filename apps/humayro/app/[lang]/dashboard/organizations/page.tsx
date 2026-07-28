import { notFound } from "next/navigation"

import { OrganizationsPage } from "./_components/organizations-page"
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
    page: "organizations",
    path: "/dashboard/organizations",
    noIndex: true,
  })
}

export default async function OrganizationsDashboardPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  await requireDashboardPageAccess({ language: lang, page: "organizations" })

  return <OrganizationsPage language={lang} />
}
