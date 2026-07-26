"use client"

import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { DashboardBreadcrumb } from "../../../../../../_components/dashboard-breadcrumb"
import { ProductForm } from "../../../../_components/product-form"

export function ProductEditPage({
  language,
  organizationId,
  productId,
}: {
  language: string
  organizationId: number
  productId: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const organizationHref = `/${language}/dashboard/organizations/${organizationId}`

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
      <DashboardBreadcrumb
        language={language}
        items={[
          {
            href: `/${language}/dashboard/organizations`,
            label: t("dashboard.organizations"),
          },
          { href: organizationHref, label: t("product.backToOrganization") },
          { label: t("product.edit") },
        ]}
      />
      <header className="my-7 flex flex-col gap-3 border-b pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            {t("product.editorEyebrow")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">
            {t("product.edit")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("product.editDescription")}
          </p>
        </div>
      </header>
      <div className="[&_[role=combobox]]:text-base [&_button]:text-base [&_input]:text-base [&_label]:text-base">
        <ProductForm
          organizationId={organizationId}
          productId={productId}
          onComplete={() => router.push(organizationHref)}
        />
      </div>
    </main>
  )
}
