import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { createTranslatedPageMetadata } from "@/lib/seo"

import { ProductEditPage } from "./_components/product-edit-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; lang: string; productId: string }>
}) {
  const { id, lang, productId } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "editProduct",
    path: `/dashboard/organizations/${id}/products/${productId}/edit`,
    noIndex: true,
  })
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; lang: string; productId: string }>
}) {
  const { id, lang, productId } = await params
  const organizationId = Number(id)
  const parsedProductId = Number(productId)

  if (
    !isLanguage(lang) ||
    !Number.isSafeInteger(organizationId) ||
    !Number.isSafeInteger(parsedProductId)
  ) {
    notFound()
  }

  return (
    <ProductEditPage
      language={lang}
      organizationId={organizationId}
      productId={parsedProductId}
    />
  )
}
