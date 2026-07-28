import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { createPageMetadata } from "@/lib/seo"
import { CatalogSection } from "../_components/storefront/catalog-section"

type ProductsPageProps = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ search?: string | string[] }>
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}

  const copy =
    lang === "uz"
      ? {
          title: "Barcha mahsulotlar",
          description:
            "Humayro katalogidagi barcha mahsulotlarni narx, turkum, rang va o‘lcham bo‘yicha saralang.",
        }
      : {
          title: "Все товары",
          description:
            "Выбирайте товары Humayro с удобной фильтрацией по цене, категории, цвету и размеру.",
        }

  return createPageMetadata({
    language: lang,
    path: "/products",
    title: copy.title,
    description: copy.description,
  })
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const [{ lang }, queryParams] = await Promise.all([params, searchParams])
  if (!isLanguage(lang)) notFound()

  const rawSearch = Array.isArray(queryParams.search)
    ? queryParams.search[0]
    : queryParams.search
  const searchQuery = rawSearch?.trim().slice(0, 120) ?? ""

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CatalogSection
        key={searchQuery}
        language={lang}
        mode="products"
        searchQuery={searchQuery}
      />
    </main>
  )
}
