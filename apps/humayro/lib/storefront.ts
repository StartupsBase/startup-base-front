import type { Language } from "@/i18n/config"
import type { ProductListDTO } from "@/lib/api/model/productListDTO"

export function getProductName(
  product: ProductListDTO,
  language: Language
) {
  return language === "ru"
    ? product.nameRu || product.name || product.nameEng || "—"
    : product.name || product.nameRu || product.nameEng || "—"
}

export function formatStorefrontPrice(
  price: number | undefined,
  language: Language
) {
  if (price == null) return "—"

  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ").format(price)} so'm`
}

export function getProductPrice(product: ProductListDTO) {
  return product.discountedPrice ?? product.basePrice
}

export function getLoginHref(language: Language, returnPath?: string) {
  const next = returnPath ? `?next=${encodeURIComponent(returnPath)}` : ""
  return `/${language}/login${next}`
}
