"use client"

import {
  CheckIcon,
  HeartIcon,
  ShoppingCart02Icon,
  Upload06Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { Language } from "@/i18n/config"
import { addItem, getGetCartQueryKey } from "@/lib/api/generated/cart/cart"
import { useGetFavoriteIds } from "@/lib/api/generated/favorite/favorite"
import { useGetByProduct } from "@/lib/api/generated/review/review"
import { hasAuthToken } from "@/lib/auth-client"
import { useGuestStorefront } from "@/lib/guest-storefront"
import { expandReviewEntries } from "@/lib/review-entries"
import {
  formatStorefrontPrice,
  getProductName,
  getProductPrice,
} from "@/lib/storefront"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import type { ProductDTO } from "@/lib/api/model/productDTO"
import type { ProductListDTO } from "@/lib/api/model/productListDTO"
import type { ReviewDTO } from "@/lib/api/model/reviewDTO"
import { Button } from "@workspace/ui/components/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { cn } from "@workspace/ui/lib/utils"

import { useStorefrontActions } from "../../../_components/storefront/use-storefront-actions"
import { ProductCard } from "../../../_components/storefront/product-card"
import { ReviewStars } from "./review-card"
import { ReviewsSection as ReviewsCarouselSection } from "./reviews-section"

export function ProductDetails({
  language,
  product,
  productId,
  reviews,
  similarProducts,
}: {
  language: Language
  product: ProductDTO
  productId: number
  reviews: ReviewDTO[]
  similarProducts: ProductListDTO[]
}) {
  const { t } = useTranslation()
  const text = useStorefrontCopy()
  const queryClient = useQueryClient()
  const hasToken = useHasAuthToken()
  const guestStorefront = useGuestStorefront()
  const actions = useStorefrontActions(language)
  const reviewsQuery = useGetByProduct(productId, {
    query: { initialData: reviews, retry: 1, staleTime: 30_000 },
  })
  const favoritesQuery = useGetFavoriteIds({
    query: { enabled: hasToken, retry: false },
  })
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<number>()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [copy, setCopy] = useState("")
  const reviewEntries = expandReviewEntries(reviewsQuery.data ?? [])
  const reviewRating = reviewEntries.length
    ? reviewEntries.reduce((sum, review) => sum + review.rating, 0) /
      reviewEntries.length
    : (product.ratingAvg ?? 0)

  const name = getProductName(product, language)
  const description =
    language === "ru"
      ? product.descriptionRu || product.descriptionUz || product.descriptionEng
      : product.descriptionUz || product.descriptionRu || product.descriptionEng
  const images = [...(product.images ?? [])]
    .sort(
      (first, second) =>
        Number(second.main ?? false) - Number(first.main ?? false) ||
        (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
    )
    .filter((image) => Boolean(image.url))
  const availableVariants = (product.variants ?? []).filter(
    (variant) => variant.id != null && variant.active !== false
  )
  const selectedVariant =
    availableVariants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants.find((variant) => (variant.stock ?? 0) > 0) ??
    availableVariants[0]
  const price =
    selectedVariant?.effectivePrice ??
    selectedVariant?.price ??
    getProductPrice(product)
  const selectedStock = selectedVariant?.stock ?? 0
  const isFavorite = hasToken
    ? (favoritesQuery.data ?? []).includes(productId)
    : actions.guestFavoriteIds.includes(productId)

  async function addSelectedToCart() {
    if (selectedVariant?.id == null || selectedStock <= 0) {
      toast.info(text.outOfStock)
      return
    }

    setIsAdding(true)
    try {
      if (!hasAuthToken()) {
        guestStorefront.addToCart(productId, selectedVariant.id, quantity)
      } else {
        await addItem({ variantId: selectedVariant.id, quantity })
        await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
      }
      toast.success(text.addedToCart)
    } catch {
      toast.error(text.actionError)
    } finally {
      setIsAdding(false)
    }
  }

  const handleCopy = async () => {
    const url = `http://localhost:3000/ru/products/${productId}`

    try {
      await navigator.clipboard.writeText(url)
      toast.success("Havola nusxalandi")
      setCopy(url)
      window.setTimeout(() => {
        setCopy("")
      }, 1000)
    } catch {
      toast.error("Havolani nusxalab bo‘lmadi")
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${language}`}>{t("productDetails.home")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${language}/#catalog`}>
                  {t("productDetails.catalog")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,.92fr)] lg:gap-12">
          <ProductGallery
            images={images.map((image) => image.url as string)}
            name={name}
            activeImage={activeImage}
            onActiveImage={setActiveImage}
          />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {product.categoryName ? (
                <span>{product.categoryName}</span>
              ) : null}
              {product.categoryName && product.organizationName ? (
                <span>•</span>
              ) : null}
              {product.organizationName ? (
                <span>{product.organizationName}</span>
              ) : null}
            </div>
            <div className="flex justify-between">
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-balance sm:text-4xl">
                {name}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className={cn(
                    "size-12 rounded-xl",
                    isFavorite &&
                      "border-primary bg-primary text-primary-foreground"
                  )}
                  aria-label={isFavorite ? text.unfavorite : text.favorite}
                  onClick={() => actions.toggleFavorite(productId, isFavorite)}
                >
                  <HugeiconsIcon
                    icon={HeartIcon}
                    className={cn("size-5", isFavorite && "fill-current")}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className={cn("size-12 cursor-pointer rounded-xl")}
                  onClick={handleCopy}
                >
                  {copy ? (
                    <HugeiconsIcon icon={CheckIcon} />
                  ) : (
                    <HugeiconsIcon icon={Upload06Icon} />
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <ReviewStars rating={reviewRating} />
              <span className="text-sm font-medium">
                {reviewRating.toFixed(1)}
              </span>
              <a
                href="#reviews"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t("productDetails.reviewCount", {
                  count: reviewEntries.length,
                })}
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3 border-y py-5">
              <p className="text-3xl font-bold text-primary">
                {formatStorefrontPrice(price, language)}
              </p>
              {(product.discountPercent ?? 0) > 0 &&
              product.basePrice != null ? (
                <>
                  <p className="pb-1 text-sm text-muted-foreground line-through">
                    {formatStorefrontPrice(product.basePrice, language)}
                  </p>
                  <span className="mb-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    −{product.discountPercent}%
                  </span>
                </>
              ) : null}
            </div>

            {description ? (
              <TiptapContentPreview content={description} />
            ) : null}

            {availableVariants.length ? (
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    {t("productDetails.chooseVariant")}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {selectedStock > 0
                      ? t("productDetails.inStock", { count: selectedStock })
                      : text.outOfStock}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableVariants.map((variant) => {
                    const active = variant.id === selectedVariant?.id
                    const unavailable = (variant.stock ?? 0) <= 0
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={unavailable}
                        className={cn(
                          "flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-sm transition",
                          active
                            ? "border-primary bg-primary/8 ring-2 ring-primary/15"
                            : "hover:border-primary/40",
                          unavailable && "cursor-not-allowed opacity-45"
                        )}
                        onClick={() => {
                          setSelectedVariantId(variant.id)
                          setQuantity(1)
                        }}
                      >
                        {variant.colorHex ? (
                          <span
                            className="size-4 shrink-0 rounded-full border shadow-sm"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                        ) : null}
                        <span className="truncate">
                          {[variant.colorName, variant.sizeValue]
                            .filter(Boolean)
                            .join(" / ") || t("productDetails.defaultVariant")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex gap-3">
              <div className="flex h-12 items-center rounded-xl border bg-background">
                <button
                  type="button"
                  className="size-11 text-lg hover:text-primary disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="size-11 text-lg hover:text-primary disabled:opacity-40"
                  disabled={quantity >= selectedStock}
                  onClick={() =>
                    setQuantity((value) => Math.min(selectedStock, value + 1))
                  }
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="h-12 flex-1 rounded-xl text-base font-semibold"
                disabled={isAdding || selectedStock <= 0}
                onClick={addSelectedToCart}
              >
                <HugeiconsIcon icon={ShoppingCart02Icon} className="size-5" />
                {isAdding ? text.adding : text.addToCart}
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x rounded-2xl border bg-muted/20 py-4 text-center">
              <ProductPromise title={t("productDetails.secure")} />
              <ProductPromise title={t("productDetails.fastDelivery")} />
              <ProductPromise title={t("productDetails.support")} />
            </div>
          </div>
        </section>

        <ReviewsCarouselSection
          language={language}
          productId={productId}
          reviews={reviewsQuery.data ?? []}
          loading={reviewsQuery.isPending}
          canReview={hasToken}
        />
        {similarProducts.length ? (
          <section className="mt-16 border-t pt-12 lg:mt-24">
            <p className="text-sm font-bold tracking-[.18em] text-primary uppercase">
              {t("productDetails.similarEyebrow")}
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {t("productDetails.similarTitle")}
              </h2>
              <Link
                href={`/${language}/#catalog`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("productDetails.viewCatalog")}
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {similarProducts.map((item, index) => (
                <ProductCard
                  key={item.id ?? index}
                  product={item}
                  language={language}
                  isFavorite={
                    item.id != null &&
                    (hasToken
                      ? (favoritesQuery.data ?? []).includes(item.id)
                      : actions.guestFavoriteIds.includes(item.id))
                  }
                  isAdding={actions.pendingCartId === item.id}
                  isTogglingFavorite={actions.pendingFavoriteId === item.id}
                  onAddToCart={actions.addProductToCart}
                  onToggleFavorite={actions.toggleFavorite}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function TiptapContentPreview({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary dark:prose-invert mt-6 max-w-none text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

function ProductGallery({
  activeImage,
  images,
  name,
  onActiveImage,
}: {
  activeImage: number
  images: string[]
  name: string
  onActiveImage: (index: number) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
      {images.length > 1 ? (
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              className={cn(
                "size-[68px] shrink-0 overflow-hidden rounded-xl border bg-muted transition",
                index === activeImage
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/40"
              )}
              onClick={() => onActiveImage(index)}
            >
              <img src={url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative order-1 aspect-square overflow-hidden rounded-3xl border bg-muted sm:order-2">
        {images.length ? (
          images.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={index === activeImage ? name : ""}
              className={cn(
                "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500",
                index === activeImage
                  ? "scale-100 opacity-100"
                  : "scale-[1.02] opacity-0"
              )}
            />
          ))
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/5 to-primary/15 text-8xl font-bold text-primary/25">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductPromise({ title }: { title: string }) {
  return (
    <p className="px-2 text-[11px] font-medium text-muted-foreground">
      {title}
    </p>
  )
}
