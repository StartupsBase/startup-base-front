import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { createPageMetadata } from "@/lib/seo"
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

  const productName = getProductName(product, lang)
  const title = `${productName} — ${lang === "ru" ? "Отзывы" : "Sharhlar"}`
  const description =
    lang === "ru"
      ? `Отзывы покупателей о товаре «${productName}» в интернет-магазине Humayro.`
      : `Humayro internet-do'konidagi «${productName}» mahsuloti haqida xaridorlar sharhlari.`

  return createPageMetadata({
    language: lang,
    path: `/products/${productId}/reviews`,
    title,
    description,
    images: product.images
      ?.map((image) => image.url)
      .filter((image): image is string => Boolean(image)),
  })
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
