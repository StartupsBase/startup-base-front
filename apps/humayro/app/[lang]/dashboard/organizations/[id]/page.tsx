import { notFound } from "next/navigation"

import { OrganizationCategoriesPage } from "./_components/organization-categories-page"
import { defaultLanguage, isLanguage } from "@/i18n/config"

export default async function OrganizationDetailsPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang, id } = (await params) as { lang?: string; id?: string }
  const organizationId = Number(id)

  return (
    <OrganizationCategoriesPage
      language={lang as string || defaultLanguage}
      organizationId={organizationId}
    />
  )
}
