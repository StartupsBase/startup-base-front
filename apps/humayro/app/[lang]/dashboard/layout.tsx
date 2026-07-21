import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DashboardShell } from "./_components/dashboard-shell"
import { isLanguage } from "@/i18n/config"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
  },
}

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
