import { notFound } from "next/navigation"

import { AdministrationPage } from "./_components/administration-page"
import { isLanguage } from "@/i18n/config"

export default async function AdministrationRoute({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  return <AdministrationPage />
}
