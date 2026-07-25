import { notFound } from "next/navigation"

import { AdministrationPage } from "./_components/administration-page"
import { isLanguage } from "@/i18n/config"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "administration",
    path: "/dashboard/adminstration",
    noIndex: true,
  })
}

export default async function AdministrationRoute({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  return <AdministrationPage language={lang} />
}
