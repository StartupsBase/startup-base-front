import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { ProductDetails } from "./_components/product-details"

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const { id, lang } = await params
  const productId = Number(id)

  if (
    !isLanguage(lang) ||
    !Number.isSafeInteger(productId) ||
    productId <= 0
  ) {
    notFound()
  }

  return <ProductDetails language={lang} productId={productId} />
}
