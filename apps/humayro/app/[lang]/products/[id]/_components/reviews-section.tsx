"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { Language } from "@/i18n/config"
import type { ReviewDTO } from "@/lib/api/model/reviewDTO"
import { expandReviewEntries } from "@/lib/review-entries"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

import { BulkReviewForm } from "./bulk-review-form"
import { ReviewCard } from "./review-card"
import { useReviewDeletion } from "./use-review-deletion"

export function ReviewsSection({
  canReview,
  language,
  loading,
  productId,
  reviews,
}: {
  canReview: boolean
  language: Language
  loading: boolean
  productId: number
  reviews: ReviewDTO[]
}) {
  const { t } = useTranslation()
  const carouselRef = useRef<HTMLDivElement>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const entries = useMemo(() => expandReviewEntries(reviews), [reviews])
  const { deleteReview, isDeleting } = useReviewDeletion({
    productId,
    reviews,
  })

  function scrollReviews(direction: -1 | 1) {
    const carousel = carouselRef.current
    if (!carousel) return

    carousel.scrollBy({
      behavior: "smooth",
      left: direction * Math.max(300, carousel.clientWidth * 0.75),
    })
  }

  return (
    <section
      id="reviews"
      className="mt-16 scroll-mt-24 border-t pt-12 lg:mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-[.18em] text-primary capitalize">
            {t("productDetails.reviewsEyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {t("productDetails.reviewsTitle")}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-muted-foreground">
            {t("productDetails.reviewCount", { count: entries.length })}
          </p>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-full"
            aria-label={t("productDetails.previousReviews")}
            disabled={entries.length < 2}
            onClick={() => scrollReviews(-1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-full"
            aria-label={t("productDetails.nextReviews")}
            disabled={entries.length < 2}
            onClick={() => scrollReviews(1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/${language}/products/${productId}/reviews`}>
              {t("productDetails.allReviews")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 min-w-0">
        {canReview ? (
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogTrigger asChild>
              <Button className="mb-6 rounded-full">
                {t("productDetails.writeReview")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{t("productDetails.writeReview")}</DialogTitle>
                <DialogDescription>
                  {t("productDetails.bulkReviewDescription")}
                </DialogDescription>
              </DialogHeader>
              <BulkReviewForm
                productId={productId}
                onComplete={() => setReviewOpen(false)}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <div className="mb-6 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            {t("productDetails.signInToReview")}
          </div>
        )}

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-52 min-w-[min(360px,85vw)] animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : entries.length ? (
          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {entries.map((review) => (
              <ReviewCard
                key={`${review.sourceReviewId}-${review.id}`}
                review={review}
                language={language}
                compact
                showImages={false}
                className="min-w-[min(360px,85vw)] snap-start"
                deleting={isDeleting}
                onDelete={deleteReview}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            {t("productDetails.noReviews")}
          </div>
        )}
      </div>
    </section>
  )
}
