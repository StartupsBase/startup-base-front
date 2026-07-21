import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { createPageMetadata, getSiteUrl } from "@/lib/seo"
import { getProductName, getProductPrice } from "@/lib/storefront"
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
  if (!isLanguage(lang) || !Number.isSafeInteger(productId) || productId <= 0) {
    return {}
  }

  const product = await getProductDetails(productId)
  if (!product) return {}
  const { t } = await getTranslation(lang)
  const title = getProductName(product, lang)
  const description =
    plainText(
      lang === "ru"
        ? product.descriptionRu ||
            product.descriptionUz ||
            product.descriptionEng
        : product.descriptionUz ||
            product.descriptionRu ||
            product.descriptionEng
    )?.slice(0, 160) ?? t("seo.siteDescription")
  const image =
    product.images?.find((item) => item.main)?.url ?? product.images?.[0]?.url

  return createPageMetadata({
    language: lang,
    path: `/products/${productId}`,
    title,
    description,
    images: image ? [image] : undefined,
    keywords: [title, product.categoryName, product.organizationName].filter(
      (value): value is string => Boolean(value)
    ),
  })
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { id, lang } = await params
  const productId = Number(id)

  if (!isLanguage(lang) || !Number.isSafeInteger(productId) || productId <= 0) {
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
  const name = getProductName(product, lang)
  const description = plainText(
    lang === "ru"
      ? product.descriptionRu || product.descriptionUz || product.descriptionEng
      : product.descriptionUz || product.descriptionRu || product.descriptionEng
  )
  const images = (product.images ?? [])
    .map((image) => image.url)
    .filter((image): image is string => Boolean(image))
  const stock = (product.variants ?? []).reduce(
    (total, variant) => total + Math.max(0, variant.stock ?? 0),
    0
  )
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: images,
    sku: String(productId),
    brand: {
      "@type": "Brand",
      name: product.organizationName || "Humayro",
    },
    ...(product.ratingCount && product.ratingAvg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: new URL(`/${lang}/products/${productId}`, getSiteUrl()).toString(),
      priceCurrency: "UZS",
      price: getProductPrice(product),
      availability:
        stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetails
        language={lang}
        product={product}
        productId={productId}
        reviews={reviews}
        similarProducts={similarProducts}
      />
    </>
  )
}
