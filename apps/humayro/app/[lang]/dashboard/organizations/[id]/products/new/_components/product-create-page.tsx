"use client"

import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { ProductForm } from "../../../_components/product-form"
import { DashboardBreadcrumb } from "../../../../../_components/dashboard-breadcrumb"

export function ProductCreatePage({
  language,
  organizationId,
}: {
  language: string
  organizationId: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const organizationHref = `/${language}/dashboard/organizations/${organizationId}`

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10">
      <DashboardBreadcrumb
        language={language}
        items={[
          {
            href: `/${language}/dashboard/organizations`,
            label: t("dashboard.organizations"),
          },
          { href: organizationHref, label: t("product.backToOrganization") },
          { label: t("product.new") },
        ]}
      />
      <header className="my-6 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("product.new")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("product.createDescription")}
        </p>
      </header>
      <ProductForm
        organizationId={organizationId}
        showAssistant
        onComplete={() => router.push(organizationHref)}
      />
    </main>
  )
}
