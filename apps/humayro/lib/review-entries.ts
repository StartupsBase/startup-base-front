import type { ReviewDTO } from "@/lib/api/model/reviewDTO"

const payloadPrefix = "__HUMAYRO_REVIEW_ENTRIES_V1__"

export type ReviewEntryImage = {
  attachmentId?: number
  name?: string
  url: string
}

export type ReviewEntry = {
  id: string
  comment?: string
  rating: number
  createdAt: string
  images: ReviewEntryImage[]
}

export type DisplayReviewEntry = ReviewEntry & {
  mine?: boolean
  sourceReviewId?: number
  userName?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeEntry(value: unknown): ReviewEntry | null {
  if (!isRecord(value)) return null

  const rating = Number(value.rating)
  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : undefined
  const id = typeof value.id === "string" ? value.id : undefined

  if (!id || !createdAt || !Number.isFinite(rating)) return null

  const images = Array.isArray(value.images)
    ? value.images.flatMap((image) => {
        if (!isRecord(image) || typeof image.url !== "string") return []

        return [
          {
            ...(typeof image.attachmentId === "number"
              ? { attachmentId: image.attachmentId }
              : {}),
            ...(typeof image.name === "string" ? { name: image.name } : {}),
            url: image.url,
          },
        ]
      })
    : []

  return {
    id,
    rating: Math.min(5, Math.max(1, rating)),
    createdAt,
    images,
    ...(typeof value.comment === "string" && value.comment.trim()
      ? { comment: value.comment }
      : {}),
  }
}

export function getReviewEntries(review: ReviewDTO): ReviewEntry[] {
  const comment = review.comment ?? ""

  if (comment.startsWith(payloadPrefix)) {
    try {
      const payload = JSON.parse(comment.slice(payloadPrefix.length)) as unknown
      if (isRecord(payload) && Array.isArray(payload.entries)) {
        const entries = payload.entries.flatMap((entry) => {
          const normalized = normalizeEntry(entry)
          return normalized ? [normalized] : []
        })
        if (entries.length) return entries
      }
    } catch {
      // Keep malformed or legacy payloads visible as a plain review.
    }
  }

  return [
    {
      id: `legacy-${review.id ?? "review"}`,
      rating: Math.min(5, Math.max(1, review.rating ?? 1)),
      createdAt: review.createdAt ?? new Date(0).toISOString(),
      images: [],
      ...(comment.trim() ? { comment } : {}),
    },
  ]
}

export function expandReviewEntries(
  reviews: ReviewDTO[]
): DisplayReviewEntry[] {
  return reviews
    .flatMap((review) =>
      getReviewEntries(review).map((entry) => ({
        ...entry,
        mine: review.mine,
        sourceReviewId: review.id,
        userName: review.userName,
      }))
    )
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
    )
}

export function serializeReviewEntries(entries: ReviewEntry[]) {
  return `${payloadPrefix}${JSON.stringify({ entries })}`
}
