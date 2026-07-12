"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { ProductForm } from "../../../_components/product-form"

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
      <Link
        href={organizationHref}
        className="text-sm font-medium text-primary hover:underline"
      >
        {t("product.backToOrganization")}
      </Link>
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
