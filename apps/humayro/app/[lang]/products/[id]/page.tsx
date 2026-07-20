import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { ProductDetails } from "./_components/product-details"
import {
  getProductDetails,
  getProductReviews,
  getSimilarProducts,
} from "./product-data"

type ProductPageProps = {
  params: Promise<{ id: string; lang: string }>
}

function plainText(value?: string) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id, lang } = await params
  const productId = Number(id)
  if (!Number.isSafeInteger(productId) || productId <= 0) return {}

  const product = await getProductDetails(productId)
  if (!product) return {}
  const title =
    lang === "ru"
      ? product.nameRu || product.name || product.nameEng
      : product.name || product.nameRu || product.nameEng
  const description = plainText(
    lang === "ru"
      ? product.descriptionRu || product.descriptionUz || product.descriptionEng
      : product.descriptionUz || product.descriptionRu || product.descriptionEng
  )
  const image = product.images?.find((item) => item.main)?.url ?? product.images?.[0]?.url

  return {
    title,
    description: description?.slice(0, 160),
    openGraph: {
      title,
      description: description?.slice(0, 200),
      images: image ? [image] : undefined,
      type: "website",
    },
  }
}

export default async function ProductDetailsPage({
  params,
}: ProductPageProps) {
  const { id, lang } = await params
  const productId = Number(id)

  if (
    !isLanguage(lang) ||
    !Number.isSafeInteger(productId) ||
    productId <= 0
  ) {
    notFound()
  }

  const product = await getProductDetails(productId)
  if (!product) notFound()

  const [reviews, similarProducts] = await Promise.all([
    getProductReviews(productId),
    product.categoryId != null
      ? getSimilarProducts(product.categoryId, productId)
      : Promise.resolve([]),
  ])

  return (
    <ProductDetails
      language={lang}
      product={product}
      productId={productId}
      reviews={reviews}
      similarProducts={similarProducts}
    />
  )
}
