"use client"

import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { Language } from "@/i18n/config"
import type { ProductDTO } from "@/lib/api/model/productDTO"
import type { ReviewDTO } from "@/lib/api/model/reviewDTO"
import { useGetByProduct } from "@/lib/api/generated/review/review"
import { expandReviewEntries } from "@/lib/review-entries"
import { getProductName } from "@/lib/storefront"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import { ReviewCard, ReviewStars } from "../../_components/review-card"
import { useReviewDeletion } from "../../_components/use-review-deletion"

type ReviewSort = "newest" | "rating-high" | "rating-low"

export function AllReviews({
  language,
  product,
  productId,
  reviews,
}: {
  language: Language
  product: ProductDTO
  productId: number
  reviews: ReviewDTO[]
}) {
  const { t } = useTranslation()
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false)
  const [sort, setSort] = useState<ReviewSort>("newest")
  const reviewsQuery = useGetByProduct(productId, {
    query: { initialData: reviews, retry: 1, staleTime: 30_000 },
  })
  const currentReviews = useMemo(
    () => reviewsQuery.data ?? [],
    [reviewsQuery.data]
  )
  const entries = useMemo(
    () => expandReviewEntries(currentReviews),
    [currentReviews]
  )
  const { deleteReview, isDeleting } = useReviewDeletion({
    productId,
    reviews: currentReviews,
  })
  const visibleEntries = (
    onlyWithPhotos
      ? entries.filter((review) => review.images.length)
      : [...entries]
  ).sort((first, second) => {
    if (sort === "rating-high") return second.rating - first.rating
    if (sort === "rating-low") return first.rating - second.rating
    return (
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime()
    )
  })
  const reviewImages = entries.flatMap((review) => review.images)
  const average = entries.length
    ? entries.reduce((sum, review) => sum + review.rating, 0) / entries.length
    : 0
  const name = getProductName(product, language)
  const productImage =
    product.images?.find((image) => image.main)?.url ?? product.images?.[0]?.url

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="-ml-3 rounded-full">
          <Link href={`/${language}/products/${productId}#reviews`}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            {t("productDetails.backToProduct")}
          </Link>
        </Button>

        <section className="mt-5 grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            {productImage ? (
              <img
                src={productImage}
                alt={name}
                className="size-24 shrink-0 rounded-2xl object-cover sm:size-28"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-[.18em] text-primary capitalize">
                {t("productDetails.reviewsEyebrow")}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("productDetails.reviewCount", { count: entries.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-3xl border bg-card px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{average.toFixed(1)}</span>
              <ReviewStars rating={average} className="text-lg" />
            </div>
            <span className="text-sm text-muted-foreground">
              {t("productDetails.reviewCount", { count: entries.length })}
            </span>
          </div>
        </section>

        {reviewImages.length ? (
          <section className="border-b py-8">
            <h2 className="text-lg font-bold">
              {t("productDetails.customerPhotos")}
            </h2>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {reviewImages.map((image, index) => (
                <img
                  key={`${image.url}-${index}`}
                  src={image.url}
                  alt={image.name || t("productDetails.reviewImage")}
                  className="size-28 shrink-0 rounded-2xl object-cover sm:size-32"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="py-8">
          <h2 className="sr-only">
            {t("productDetails.allReviews")}
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4 border-y py-4">
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as ReviewSort)}
            >
              <SelectTrigger className="w-auto min-w-44 border-0 bg-transparent px-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="newest">
                  {language === "ru" ? "Сначала новые" : "Avval yangilari"}
                </SelectItem>
                <SelectItem value="rating-high">
                  {language === "ru"
                    ? "С высокой оценкой"
                    : "Yuqori baholangan"}
                </SelectItem>
                <SelectItem value="rating-low">
                  {language === "ru"
                    ? "С низкой оценкой"
                    : "Past baholangan"}
                </SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              aria-pressed={onlyWithPhotos}
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setOnlyWithPhotos((value) => !value)}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded border transition",
                  onlyWithPhotos
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background"
                )}
              >
                {onlyWithPhotos ? (
                  <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
                ) : null}
              </span>
              {t("productDetails.onlyWithPhotos")}
            </button>
          </div>

          {visibleEntries.length ? (
            <div>
              {visibleEntries.map((review) => (
                <ReviewCard
                  key={`${review.sourceReviewId}-${review.id}`}
                  review={review}
                  language={language}
                  variant="flat"
                  deleting={isDeleting}
                  onDelete={deleteReview}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed p-14 text-center text-muted-foreground">
              {onlyWithPhotos
                ? t("productDetails.noPhotoReviews")
                : t("productDetails.noReviews")}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
