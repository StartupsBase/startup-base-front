"use client"

import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { Language } from "@/i18n/config"
import type { ProductListDTO } from "@/lib/api/model/productListDTO"
import {
  formatStorefrontPrice,
  getProductName,
  getProductPrice,
} from "@/lib/storefront"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type ProductCardProps = {
  product: ProductListDTO
  language: Language
  isFavorite: boolean
  isAdding: boolean
  isTogglingFavorite: boolean
  onAddToCart: (productId: number) => void
  onToggleFavorite: (productId: number, isFavorite: boolean) => void
}

export function ProductCard({
  product,
  language,
  isFavorite,
  isAdding,
  isTogglingFavorite,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) {
  const text = useStorefrontCopy()
  const name = getProductName(product, language)
  const price = getProductPrice(product)
  const hasDiscount =
    product.discountPercent != null && product.discountPercent > 0
  const productId = product.id

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,#f7d8dc,#efb6bf)] dark:bg-[linear-gradient(145deg,#2f282b,#3c252c)]">
        {product.mainImageUrl ? (
          <span
            role="img"
            aria-label={name}
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.035]"
            style={{ backgroundImage: `url(${product.mainImageUrl})` }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-7xl font-bold text-white/70">
            {name.charAt(0).toLocaleUpperCase()}
          </span>
        )}

        {hasDiscount && (
          <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
            −{product.discountPercent}%
          </span>
        )}

        <button
          type="button"
          aria-label={isFavorite ? text.unfavorite : text.favorite}
          aria-pressed={isFavorite}
          disabled={productId == null || isTogglingFavorite}
          className={cn(
            "absolute top-4 right-4 grid size-12 place-items-center rounded-full bg-white text-[#18181b] shadow-sm transition hover:scale-105 disabled:opacity-60",
            isFavorite && "bg-primary text-primary-foreground"
          )}
          onClick={() =>
            productId != null && onToggleFavorite(productId, isFavorite)
          }
        >
          <HugeiconsIcon
            icon={HeartIcon}
            className={cn("size-6", isFavorite && "fill-current")}
          />
        </button>

        {product.totalStock === 0 && (
          <span className="absolute right-4 bottom-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur">
            {text.outOfStock}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight">
              {formatStorefrontPrice(price, language)}
            </p>
            {hasDiscount && product.basePrice != null && (
              <p className="text-sm text-muted-foreground line-through">
                {formatStorefrontPrice(product.basePrice, language)}
              </p>
            )}
          </div>
          {product.ratingAvg != null && (
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
              ★ {product.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-12 text-base leading-6 text-muted-foreground">
          {name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground/75">
          {[product.categoryName, product.organizationName].filter(Boolean).join(" · ")}
        </p>

        <Button
          type="button"
          size="lg"
          disabled={
            productId == null || product.totalStock === 0 || isAdding
          }
          className="mt-4 h-12 w-full rounded-2xl text-base font-bold"
          onClick={() => productId != null && onAddToCart(productId)}
        >
          <HugeiconsIcon icon={ShoppingCart02Icon} className="size-5" />
          {isAdding ? text.adding : text.addToCart}
        </Button>
      </div>
    </article>
  )
}
