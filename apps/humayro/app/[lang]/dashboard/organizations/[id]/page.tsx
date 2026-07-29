import { notFound } from "next/navigation"

import { OrganizationCategoriesPage } from "./_components/organization-categories-page"
import { defaultLanguage, isLanguage } from "@/i18n/config"
import { requireDashboardPageAccess } from "@/lib/dashboard-auth"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const { id, lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "organization",
    path: `/dashboard/organizations/${id}`,
    noIndex: true,
  })
}

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

  await requireDashboardPageAccess({
    language: lang,
    organizationId,
    page: "organization",
  })

  return (
    <OrganizationCategoriesPage
      language={lang ?? defaultLanguage}
      organizationId={organizationId}
    />
  )
}
