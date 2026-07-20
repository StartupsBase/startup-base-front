import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { getProductName } from "@/lib/storefront"
import { getProductDetails, getProductReviews } from "../product-data"

import { AllReviews } from "./_components/all-reviews"

type ReviewsPageProps = {
  params: Promise<{ id: string; lang: string }>
}

export async function generateMetadata({
  params,
}: ReviewsPageProps): Promise<Metadata> {
  const { id, lang } = await params
  const productId = Number(id)
  if (!isLanguage(lang) || !Number.isSafeInteger(productId)) return {}

  const product = await getProductDetails(productId)
  if (!product) return {}

  return {
    title: `${getProductName(product, lang)} — ${lang === "ru" ? "Отзывы" : "Sharhlar"}`,
  }
}

export default async function ReviewsPage({ params }: ReviewsPageProps) {
  const { id, lang } = await params
  const productId = Number(id)

  if (!isLanguage(lang) || !Number.isSafeInteger(productId) || productId <= 0) {
    notFound()
  }

  const [product, reviews] = await Promise.all([
    getProductDetails(productId),
    getProductReviews(productId),
  ])

  if (!product) notFound()

  return (
    <AllReviews
      language={lang}
      product={product}
      productId={productId}
      reviews={reviews}
    />
  )
}
