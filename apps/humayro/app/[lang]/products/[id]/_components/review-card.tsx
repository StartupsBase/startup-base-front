"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { Language } from "@/i18n/config"
import type { DisplayReviewEntry } from "@/lib/review-entries"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

export function ReviewCard({
  className,
  compact = false,
  language,
  review,
}: {
  className?: string
  compact?: boolean
  language: Language
  review: DisplayReviewEntry
}) {
  const { t } = useTranslation()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const userName = review.userName || t("productDetails.anonymous")

  return (
    <>
      <article
        className={cn(
          "flex h-full flex-col rounded-2xl border bg-card p-5",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">
              {userName.charAt(0).tocapitalize()}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{userName}</h3>
              <time className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(
                  language === "ru" ? "ru-RU" : "uz-UZ",
                  { dateStyle: "medium" }
                ).format(new Date(review.createdAt))}
              </time>
            </div>
          </div>
          <ReviewStars rating={review.rating} />
        </div>

        <p
          className={cn(
            "mt-4 text-sm leading-6 text-muted-foreground",
            compact && "line-clamp-4"
          )}
        >
          {review.comment || t("productDetails.noComment")}
        </p>

        {review.images.length ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {review.images.slice(0, 3).map((image, index) => (
              <button
                key={`${review.id}-${image.url}`}
                type="button"
                className="relative aspect-square overflow-hidden rounded-xl bg-muted"
                onClick={() => setSelectedImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.name || t("productDetails.reviewImage")}
                  className="size-full object-cover transition duration-300 hover:scale-105"
                />
                {index === 2 && review.images.length > 3 ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-bold text-white">
                    +{review.images.length - 3}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </article>

      <Dialog
        open={selectedImage != null}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {t("productDetails.reviewImage")}
          </DialogTitle>
          {selectedImage ? (
            <img
              src={selectedImage}
              alt={t("productDetails.reviewImage")}
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ReviewStars({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  return (
    <span
      className={cn(
        "shrink-0 text-sm tracking-wider text-amber-400",
        className
      )}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star > Math.round(rating) ? "text-muted" : ""}
        >
          ★
        </span>
      ))}
    </span>
  )
}
