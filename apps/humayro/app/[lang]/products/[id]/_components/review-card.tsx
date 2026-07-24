"use client"

import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { Language } from "@/i18n/config"
import type { DisplayReviewEntry } from "@/lib/review-entries"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function ReviewCard({
  className,
  compact = false,
  deleting = false,
  language,
  onDelete,
  review,
}: {
  className?: string
  compact?: boolean
  deleting?: boolean
  language: Language
  onDelete?: (review: DisplayReviewEntry) => Promise<void>
  review: DisplayReviewEntry
}) {
  const { t } = useTranslation()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
              {userName.charAt(0).toUpperCase()}
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
          <div className="flex shrink-0 items-center gap-1">
            <ReviewStars rating={review.rating} />
            {review.mine && onDelete ? (
              <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("productDetails.deleteReview")}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <PopoverHeader>
                    <PopoverTitle>
                      {t("productDetails.deleteReviewTitle")}
                    </PopoverTitle>
                    <PopoverDescription>
                      {t("productDetails.deleteReviewDescription")}
                    </PopoverDescription>
                  </PopoverHeader>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={deleting}
                      onClick={() => setDeleteOpen(false)}
                    >
                      {t("productDetails.deleteReviewCancel")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deleting}
                      onClick={async () => {
                        try {
                          await onDelete(review)
                          setDeleteOpen(false)
                        } catch {
                          // The shared deletion hook already reports the error.
                        }
                      }}
                    >
                      {t("productDetails.deleteReviewConfirm")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
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
          <div className="mt-4 flex flex-wrap gap-2">
            {review.images.slice(0, 4).map((image, index) => (
              <button
                key={`${review.id}-${image.url}`}
                type="button"
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-lg bg-muted",
                  compact ? "size-14" : "size-16 sm:size-18"
                )}
                onClick={() => setSelectedImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.name || t("productDetails.reviewImage")}
                  className="size-full object-cover transition duration-300 hover:scale-105"
                />
                {index === 3 && review.images.length > 4 ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-bold text-white">
                    +{review.images.length - 4}
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
        "inline-flex shrink-0 items-center gap-0.5 text-sm",
        className
      )}
      aria-label={`${rating.toFixed(1)} / 5`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, rating - index)) * 100
        return <StarGlyph key={index} fill={fill} />
      })}
    </span>
  )
}

export function RatingInput({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (rating: number) => void
  value: number
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="inline-flex rounded-full border bg-muted/35 p-1.5 shadow-sm"
        role="radiogroup"
        aria-label={label}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className="relative size-8">
            <span className="absolute inset-1">
              <StarGlyph
                fill={Math.min(1, Math.max(0, value - index)) * 100}
                className="size-full"
              />
            </span>
            {[0.5, 1].map((step) => {
              const rating = index + step
              return (
                <button
                  key={step}
                  type="button"
                  role="radio"
                  aria-checked={value === rating}
                  aria-label={`${rating} / 5`}
                  title={`${rating} / 5`}
                  className={cn(
                    "absolute inset-y-0 z-10 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    step === 0.5 ? "left-0 w-1/2" : "right-0 w-1/2"
                  )}
                  onClick={() => onChange(rating)}
                />
              )
            })}
          </span>
        ))}
      </div>
      <output className="min-w-12 rounded-full bg-amber-400/15 px-2.5 py-1 text-center text-sm font-bold text-amber-600 dark:text-amber-300">
        {value.toFixed(1)}
      </output>
    </div>
  )
}

function StarGlyph({ className, fill }: { className?: string; fill: number }) {
  return (
    <span
      className={cn("relative block size-[1em]", className)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full fill-muted stroke-muted-foreground/25"
      >
        <path d="m12 2.7 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.9l-5.56 2.92 1.06-6.2L3 9.23l6.22-.9L12 2.7Z" />
      </svg>
      <span
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - fill}% 0 0)` }}
      >
        <svg
          viewBox="0 0 24 24"
          className="absolute inset-0 size-full fill-amber-400 stroke-amber-500"
        >
          <path d="m12 2.7 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.9l-5.56 2.92 1.06-6.2L3 9.23l6.22-.9L12 2.7Z" />
        </svg>
      </span>
    </span>
  )
}
