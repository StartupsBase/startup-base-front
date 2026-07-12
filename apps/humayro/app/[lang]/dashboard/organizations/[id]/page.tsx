import { notFound } from "next/navigation"

import { OrganizationCategoriesPage } from "./_components/organization-categories-page"
import { isLanguage } from "@/i18n/config"

export default async function OrganizationDetailsPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang, id } = (await params) as { lang?: string; id?: string }
  const organizationId = Number(id)

  if (
    !isLanguage(lang) ||
    !Number.isSafeInteger(organizationId) ||
    organizationId <= 0
  ) {
    notFound()
  }

  return (
    <OrganizationCategoriesPage
      language={lang}
      organizationId={organizationId}
    />
  )
}
