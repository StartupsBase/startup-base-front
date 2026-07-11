import { notFound } from "next/navigation"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { isLanguage } from "@/i18n/config"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) {
    notFound()
  }

  return <DashboardShell language={lang}>{children}</DashboardShell>
}
