"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  ImageAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { Language } from "@/i18n/config"
import { useUploadImages } from "@/lib/api/generated/attachment-controller/attachment-controller"
import {
  getGetByProductQueryKey,
  useAddOrUpdate,
} from "@/lib/api/generated/review/review"
import type { ReviewDTO } from "@/lib/api/model/reviewDTO"
import {
  expandReviewEntries,
  getReviewEntries,
  serializeReviewEntries,
  type ReviewEntry,
} from "@/lib/review-entries"
import { Button } from "@workspace/ui/components/button"

import { ReviewCard, ReviewStars } from "./review-card"

const maxReviewImages = 6
const maxReviewImageSize = 8 * 1024 * 1024

type SelectedImage = {
  file: File
  id: string
  previewUrl: string
}

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
  const queryClient = useQueryClient()
  const carouselRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedImagesRef = useRef<SelectedImage[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const reviewMutation = useAddOrUpdate()
  const uploadImages = useUploadImages()
  const entries = useMemo(() => expandReviewEntries(reviews), [reviews])
  const ratingDistribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((value) => ({
        value,
        count: entries.filter((review) => Math.round(review.rating) === value)
          .length,
      })),
    [entries]
  )
  const average = entries.length
    ? entries.reduce((sum, review) => sum + review.rating, 0) / entries.length
    : 0
  const isSubmitting = reviewMutation.isPending || uploadImages.isPending

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(
    () => () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl)
      )
    },
    []
  )

  function handleImageSelection(files: FileList | null) {
    const incoming = Array.from(files ?? [])
    if (fileInputRef.current) fileInputRef.current.value = ""

    if (incoming.some((file) => !file.type.startsWith("image/"))) {
      toast.error(t("productDetails.reviewImageTypeInvalid"))
      return
    }
    if (incoming.some((file) => file.size > maxReviewImageSize)) {
      toast.error(t("productDetails.reviewImageTooLarge"))
      return
    }
    if (selectedImages.length + incoming.length > maxReviewImages) {
      toast.error(
        t("productDetails.reviewImageLimit", { count: maxReviewImages })
      )
      return
    }

    setSelectedImages((current) => [
      ...current,
      ...incoming.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        previewUrl: URL.createObjectURL(file),
      })),
    ])
  }

  function removeSelectedImage(id: string) {
    setSelectedImages((current) => {
      const removed = current.find((image) => image.id === id)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return current.filter((image) => image.id !== id)
    })
  }

  function clearSelectedImages() {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setSelectedImages([])
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const uploaded = selectedImages.length
        ? await uploadImages.mutateAsync({
            data: { files: selectedImages.map((image) => image.file) },
          })
        : []
      const images = uploaded.flatMap((attachment, index) =>
        attachment.s3Url
          ? [
              {
                ...(attachment.id != null
                  ? { attachmentId: attachment.id }
                  : {}),
                name: attachment.fileName ?? selectedImages[index]?.file.name,
                url: attachment.s3Url,
              },
            ]
          : []
      )
      if (selectedImages.length && images.length !== selectedImages.length) {
        throw new Error("Some review images were not uploaded")
      }
      const mine = reviews.find((review) => review.mine)
      const previousEntries = mine ? getReviewEntries(mine) : []
      const newEntry: ReviewEntry = {
        id: crypto.randomUUID(),
        rating,
        createdAt: new Date().toISOString(),
        images,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      }

      await reviewMutation.mutateAsync({
        data: {
          productId,
          rating,
          comment: serializeReviewEntries([...previousEntries, newEntry]),
        },
      })
      await queryClient.invalidateQueries({
        queryKey: getGetByProductQueryKey(productId),
      })
      setComment("")
      setRating(5)
      clearSelectedImages()
      toast.success(t("productDetails.reviewSaved"))
    } catch {
      toast.error(t("productDetails.reviewFailed"))
    }
  }

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
          <p className="text-sm font-bold tracking-[.18em] text-primary uppercase">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-3xl border bg-card p-6">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold">{average.toFixed(1)}</span>
            <span className="pb-1 text-sm text-muted-foreground">/ 5</span>
          </div>
          <ReviewStars rating={average} className="mt-3" />
          <div className="mt-6 space-y-2">
            {ratingDistribution.map((item) => (
              <div key={item.value} className="flex items-center gap-2 text-xs">
                <span className="w-3">{item.value}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${entries.length ? (item.count / entries.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-5 text-right text-muted-foreground">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          {canReview ? (
            <form
              onSubmit={submitReview}
              className="mb-6 rounded-3xl border bg-card p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">
                  {t("productDetails.writeReview")}
                </h3>
                <div
                  className="flex gap-1"
                  aria-label={t("productDetails.rating")}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`text-2xl transition hover:scale-110 ${
                        value <= rating ? "text-amber-400" : "text-muted"
                      }`}
                      onClick={() => setRating(value)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={comment}
                className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder={t("productDetails.reviewPlaceholder")}
                onChange={(event) => setComment(event.target.value)}
              />

              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => handleImageSelection(event.target.files)}
                />
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <HugeiconsIcon icon={ImageAdd01Icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {t("productDetails.addReviewImages")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("productDetails.reviewImagesHint", {
                        count: maxReviewImages,
                      })}
                    </span>
                  </span>
                </button>
              </div>

              {selectedImages.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {selectedImages.map((image) => (
                    <div
                      key={image.id}
                      className="group relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                    >
                      <img
                        src={image.previewUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/65 text-white"
                        aria-label={t("productDetails.removeReviewImage")}
                        onClick={() => removeSelectedImage(image.id)}
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          className="size-3.5"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("productDetails.submittingReview")
                    : t("productDetails.submitReview")}
                </Button>
              </div>
            </form>
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
              className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
            >
              {entries.map((review) => (
                <ReviewCard
                  key={`${review.sourceReviewId}-${review.id}`}
                  review={review}
                  language={language}
                  compact
                  className="min-w-[min(360px,85vw)] snap-start"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              {t("productDetails.noReviews")}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
