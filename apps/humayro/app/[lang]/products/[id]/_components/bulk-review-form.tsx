"use client"

import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  ImageAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useUploadImages } from "@/lib/api/generated/attachment-controller/attachment-controller"
import {
  getGetByProductQueryKey,
  useAddOrUpdateBulk,
} from "@/lib/api/generated/review/review"
import { Button } from "@workspace/ui/components/button"
import { DialogFooter } from "@workspace/ui/components/dialog"

import { RatingInput } from "./review-card"

const maxBulkReviews = 10
const maxReviewImages = 6
const maxReviewImageSize = 8 * 1024 * 1024

type SelectedImage = {
  file: File
  id: string
  previewUrl: string
}

type ReviewDraft = {
  comment: string
  id: string
  images: SelectedImage[]
  rating: number
}

function createDraft(id = crypto.randomUUID()): ReviewDraft {
  return {
    comment: "",
    id,
    images: [],
    rating: 5,
  }
}

export function BulkReviewForm({
  onComplete,
  productId,
}: {
  onComplete: () => void
  productId: number
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const addReviews = useAddOrUpdateBulk()
  const uploadImages = useUploadImages()
  const [drafts, setDrafts] = useState<ReviewDraft[]>(() => [
    createDraft("initial"),
  ])
  const draftsRef = useRef(drafts)
  const isSubmitting = addReviews.isPending || uploadImages.isPending

  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  useEffect(
    () => () => {
      draftsRef.current.forEach((draft) =>
        draft.images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      )
    },
    []
  )

  function updateDraft(id: string, patch: Partial<ReviewDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft))
    )
  }

  function addDraft() {
    if (drafts.length >= maxBulkReviews) {
      toast.error(
        t("productDetails.bulkReviewLimit", { count: maxBulkReviews })
      )
      return
    }

    setDrafts((current) => [...current, createDraft()])
  }

  function removeDraft(id: string) {
    setDrafts((current) => {
      const removed = current.find((draft) => draft.id === id)
      removed?.images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      return current.filter((draft) => draft.id !== id)
    })
  }

  function selectImages(draft: ReviewDraft, files: FileList | null) {
    const incoming = Array.from(files ?? [])
    if (!incoming.length) return

    if (incoming.some((file) => !file.type.startsWith("image/"))) {
      toast.error(t("productDetails.reviewImageTypeInvalid"))
      return
    }
    if (incoming.some((file) => file.size > maxReviewImageSize)) {
      toast.error(t("productDetails.reviewImageTooLarge"))
      return
    }
    if (draft.images.length + incoming.length > maxReviewImages) {
      toast.error(
        t("productDetails.reviewImageLimit", { count: maxReviewImages })
      )
      return
    }

    updateDraft(draft.id, {
      images: [
        ...draft.images,
        ...incoming.map((file) => ({
          file,
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
        })),
      ],
    })
  }

  function removeImage(draft: ReviewDraft, imageId: string) {
    const removed = draft.images.find((image) => image.id === imageId)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    updateDraft(draft.id, {
      images: draft.images.filter((image) => image.id !== imageId),
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const files = drafts.flatMap((draft) =>
        draft.images.map((image) => image.file)
      )
      const uploaded = files.length
        ? await uploadImages.mutateAsync({ data: { files } })
        : []

      if (
        uploaded.length !== files.length ||
        uploaded.some((attachment) => attachment.id === undefined)
      ) {
        throw new Error("Review attachments were not uploaded completely")
      }

      let attachmentOffset = 0
      const data = drafts.map((draft) => {
        const attachmentIds = uploaded
          .slice(attachmentOffset, attachmentOffset + draft.images.length)
          .map((attachment) => attachment.id as number)
        attachmentOffset += draft.images.length

        return {
          productId,
          rating: draft.rating,
          ...(draft.comment.trim() ? { comment: draft.comment.trim() } : {}),
          ...(attachmentIds.length ? { attachmentIds } : {}),
        }
      })

      await addReviews.mutateAsync({ data })
      await queryClient.invalidateQueries({
        queryKey: getGetByProductQueryKey(productId),
      })
      drafts.forEach((draft) =>
        draft.images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      )
      toast.success(t("productDetails.reviewsSaved", { count: drafts.length }))
      onComplete()
    } catch {
      toast.error(t("productDetails.reviewFailed"))
    }
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-3">
        {drafts.map((draft, index) => (
          <fieldset
            key={draft.id}
            disabled={isSubmitting}
            className="grid gap-3 rounded-2xl border bg-muted/20 p-4 disabled:opacity-70"
          >
            <legend className="sr-only">
              {t("productDetails.reviewItem", { number: index + 1 })}
            </legend>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {t("productDetails.reviewItem", { number: index + 1 })}
              </p>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={t("productDetails.removeReview")}
                disabled={drafts.length === 1 || isSubmitting}
                onClick={() => removeDraft(draft.id)}
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            </div>

            <RatingInput
              label={t("productDetails.rating")}
              value={draft.rating}
              onChange={(rating) => updateDraft(draft.id, { rating })}
            />

            <textarea
              value={draft.comment}
              className="min-h-24 w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder={t("productDetails.reviewPlaceholder")}
              onChange={(event) =>
                updateDraft(draft.id, { comment: event.target.value })
              }
            />

            <input
              id={`review-images-${draft.id}`}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                selectImages(draft, event.target.files)
                event.target.value = ""
              }}
            />
            <label
              htmlFor={`review-images-${draft.id}`}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
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
            </label>

            {draft.images.length ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {draft.images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                  >
                    <Image
                      src={image.previewUrl}
                      alt=""
                      fill
                      sizes="80px"
                      unoptimized
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/65 text-white"
                      aria-label={t("productDetails.removeReviewImage")}
                      onClick={() => removeImage(draft, image.id)}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </fieldset>
        ))}
      </div>

      {drafts.length < maxBulkReviews ? (
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          disabled={isSubmitting}
          onClick={addDraft}
        >
          <HugeiconsIcon icon={Add01Icon} />
          {t("productDetails.addAnotherReview")}
        </Button>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("productDetails.submittingReviews")
            : t("productDetails.submitReviews", { count: drafts.length })}
        </Button>
      </DialogFooter>
    </form>
  )
}
