import { notFound } from "next/navigation"

import { Dashboard } from "./_components/dashboard"
import { isLanguage } from "@/i18n/config"

export default async function DashboardPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  return <Dashboard language={lang} />
}
