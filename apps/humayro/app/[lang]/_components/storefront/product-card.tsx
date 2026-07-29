"use client"

import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useMemo, useState } from "react"

import type { Language } from "@/i18n/config"
import { useGetById2 } from "@/lib/api/generated/product/product"
import type { ProductListDTO } from "@/lib/api/model/productListDTO"
import {
  formatStorefrontPrice,
  getAvailableStock,
  getProductName,
  getProductPrice,
} from "@/lib/storefront"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type ProductCardProps = {
  compact?: boolean
  product: ProductListDTO
  language: Language
  isFavorite: boolean
  isAdding: boolean
  isTogglingFavorite: boolean
  onAddToCart: (productId: number) => void
  onToggleFavorite: (productId: number, isFavorite: boolean) => void
  onNavigate?: () => void
}

export function ProductCard({
  compact = false,
  product,
  language,
  isFavorite,
  isAdding,
  isTogglingFavorite,
  onAddToCart,
  onToggleFavorite,
  onNavigate,
}: ProductCardProps) {
  const text = useStorefrontCopy()
  const [isHovered, setIsHovered] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const productId = product.id
  const detailQuery = useGetById2(productId ?? 0, {
    query: {
      enabled: productId != null && (!product.mainImageUrl || isHovered),
      staleTime: 5 * 60_000,
      retry: 1,
    },
  })
  const name = getProductName(product, language)
  const price = getProductPrice(product)
  const soldOut = getAvailableStock(product) === 0
  const hasDiscount = (product.discountPercent ?? 0) > 0
  const imageUrls = useMemo(() => {
    const detailImages = [...(detailQuery.data?.images ?? [])]
      .sort(
        (first, second) =>
          Number(second.main ?? false) - Number(first.main ?? false) ||
          (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
      )
      .map((image) => image.url)
      .filter((url): url is string => Boolean(url))

    return Array.from(
      new Set([product.mainImageUrl, ...detailImages].filter(Boolean))
    ) as string[]
  }, [detailQuery.data?.images, product.mainImageUrl])
  function updateImageFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (imageUrls.length < 2) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const progress = Math.max(
      0,
      Math.min(0.999, (event.clientX - bounds.left) / bounds.width)
    )
    setActiveImage(Math.floor(progress * imageUrls.length))
  }

  return (
    <article
      className={cn(
        "group min-w-0 overflow-hidden border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg",
        compact ? "rounded-xl" : "rounded-2xl"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          compact ? "aspect-[4/3]" : "aspect-square"
        )}
        onPointerEnter={() => setIsHovered(true)}
        onPointerMove={updateImageFromPointer}
        onPointerLeave={() => {
          setIsHovered(false)
          setActiveImage(0)
        }}
      >
        {imageUrls.length ? (
          imageUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={index === 0 ? name : ""}
              aria-hidden={index !== activeImage}
              className={cn(
                "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500 ease-out",
                index === activeImage
                  ? "scale-100 opacity-100 group-hover:scale-[1.025]"
                  : "scale-[1.015] opacity-0"
              )}
            />
          ))
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/5 to-primary/15 text-4xl font-bold text-primary/35">
            {name.charAt(0).toLocaleUpperCase()}
          </div>
        )}

        {productId != null ? (
          <Link
            href={`/${language}/products/${productId}`}
            aria-label={name}
            className="absolute inset-0 z-10"
            onClick={onNavigate}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex items-start justify-between gap-2">
          {hasDiscount ? (
            <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
              −{product.discountPercent}%
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label={isFavorite ? text.unfavorite : text.favorite}
            aria-pressed={isFavorite}
            disabled={productId == null || isTogglingFavorite}
            className={cn(
              "pointer-events-auto",
              "grid size-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-60",
              isFavorite && "bg-primary text-primary-foreground"
            )}
            onClick={() =>
              productId != null && onToggleFavorite(productId, isFavorite)
            }
          >
            <HugeiconsIcon
              icon={HeartIcon}
              className={cn("size-4", isFavorite && "fill-current")}
            />
          </button>
        </div>

        {imageUrls.length > 1 ? (
          <div className="pointer-events-none absolute right-2 bottom-2 left-2 z-20 flex gap-1">
            {imageUrls.map((url, index) => (
              <span
                key={url}
                className={cn(
                  "h-1 flex-1 rounded-full bg-background/55 shadow-sm transition",
                  index === activeImage && "bg-primary"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className={compact ? "p-2" : "p-3"}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className={cn(
                "font-semibold",
                compact
                  ? "line-clamp-1 text-xs leading-5"
                  : "line-clamp-2 min-h-11 text-[15px] leading-[1.4]"
              )}
            >
              {productId != null ? (
                <Link
                  href={`/${language}/products/${productId}`}
                  className="transition-colors hover:text-primary"
                  onClick={onNavigate}
                >
                  {name}
                </Link>
              ) : (
                name
              )}
            </h3>
            {!compact ? (
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {[product.categoryName, product.organizationName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
          {product.ratingAvg != null ? (
            <span className="shrink-0 text-[11px] font-semibold text-primary">
              ★ {product.ratingAvg.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className={compact ? "mt-1.5" : "mt-3"}>
          <div className="min-w-0">
            <p
              className={cn(
                "font-commerce truncate font-bold text-primary",
                compact ? "text-xs" : "text-base"
              )}
            >
              {formatStorefrontPrice(price, language)}
            </p>
            {hasDiscount && product.basePrice != null ? (
              <p className="text-[10px] text-muted-foreground line-through">
                {formatStorefrontPrice(product.basePrice, language)}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            aria-label={text.addToCart}
            disabled={productId == null || isAdding || soldOut}
            className={cn(
              "w-full rounded-xl font-semibold",
              compact ? "mt-2 h-8 px-2 text-xs" : "mt-3 h-10"
            )}
            onClick={() => productId != null && onAddToCart(productId)}
          >
            {isAdding ? (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground" />
            ) : soldOut ? (
              <span className="text-wrap text-destructive">
                {text.outOfStock}
              </span>
            ) : (
              <>
                <HugeiconsIcon icon={ShoppingCart02Icon} className="size-4" />
                <span>{text.addToCart}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
