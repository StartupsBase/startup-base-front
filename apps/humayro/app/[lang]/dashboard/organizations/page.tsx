import { notFound } from "next/navigation"

import { OrganizationsPage } from "@/components/organizations-page"
import { isLanguage } from "@/i18n/config"

export default async function OrganizationsDashboardPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  return <OrganizationsPage language={lang} />
}
