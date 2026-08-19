import { notFound } from "next/navigation"

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
    page: "addresses",
    path: "/dashboard/addresses",
    noIndex: true,
  })
}

export default async function AddressesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  await requireDashboardPageAccess({ language: lang, page: "addresses" })

  return children
}
