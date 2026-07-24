"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  getGetByProductQueryKey,
  useAddOrUpdate,
  useDelete9,
} from "@/lib/api/generated/review/review"
import type { ReviewDTO } from "@/lib/api/model/reviewDTO"
import type { DisplayReviewEntry } from "@/lib/review-entries"
import { getReviewEntries, serializeReviewEntries } from "@/lib/review-entries"

export function useReviewDeletion({
  productId,
  reviews,
}: {
  productId: number
  reviews: ReviewDTO[]
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const deleteMutation = useDelete9()
  const updateMutation = useAddOrUpdate()

  async function deleteReview(entry: DisplayReviewEntry) {
    if (!entry.mine || entry.sourceReviewId == null) return

    const sourceReview = reviews.find(
      (review) => review.id === entry.sourceReviewId
    )
    if (!sourceReview) return

    try {
      const remainingEntries = getReviewEntries(sourceReview).filter(
        (item) => item.id !== entry.id
      )

      if (!remainingEntries.length) {
        await deleteMutation.mutateAsync({ id: entry.sourceReviewId })
      } else {
        const average =
          remainingEntries.reduce((sum, item) => sum + item.rating, 0) /
          remainingEntries.length
        const attachmentIds = remainingEntries.flatMap((item) =>
          item.images.flatMap((image) =>
            image.attachmentId == null ? [] : [image.attachmentId]
          )
        )

        await updateMutation.mutateAsync({
          data: {
            productId,
            rating: Math.min(5, Math.max(1, Math.round(average))),
            comment: serializeReviewEntries(remainingEntries),
            ...(attachmentIds.length ? { attachmentIds } : {}),
          },
        })
      }

      await queryClient.invalidateQueries({
        queryKey: getGetByProductQueryKey(productId),
      })
      toast.success(t("productDetails.reviewDeleted"))
    } catch {
      toast.error(t("productDetails.reviewDeleteFailed"))
      throw new Error("Review deletion failed")
    }
  }

  return {
    deleteReview,
    isDeleting: deleteMutation.isPending || updateMutation.isPending,
  }
}
