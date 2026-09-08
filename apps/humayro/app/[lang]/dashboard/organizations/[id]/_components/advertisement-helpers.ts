import type { OrganizationAdvertisementResponse } from "@/lib/api"

export const ADVERTISEMENT_PAGE_SIZE = 12
export const MAX_ADVERTISEMENT_VIDEO_SIZE = 5 * 1024 * 1024
export const ADVERTISEMENT_TIME_ZONE = "Asia/Tashkent"

export function safeAdvertisementUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

/** All scheduling inputs use Tashkent time, regardless of the admin's device. */
export function toAdvertisementDateInput(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ""
  return new Date(date.getTime() + 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
}

export function fromAdvertisementDateInput(value: string) {
  return value ? new Date(`${value}+05:00`).toISOString() : undefined
}

export function advertisementStatus(
  ad: OrganizationAdvertisementResponse,
  now = Date.now()
) {
  if (ad.active === false) return "hidden"
  if (ad.endsAt && new Date(ad.endsAt).getTime() <= now) return "ended"
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) return "scheduled"
  return "published"
}

export function formatAdvertisementDate(
  value: string | undefined,
  language: string
) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "—"
  return new Intl.DateTimeFormat(
    language.startsWith("ru") ? "ru-RU" : "uz-UZ",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: ADVERTISEMENT_TIME_ZONE,
    }
  ).format(new Date(value))
}
