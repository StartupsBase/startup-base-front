"use client"

import { useTranslation } from "react-i18next"
import type { OrganizationAdvertisementResponse } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { VideoPlayer } from "@workspace/ui/components/video-player"
import {
  advertisementStatus,
  formatAdvertisementDate,
  safeAdvertisementUrl,
} from "./advertisement-helpers"

export function AdvertisementCard({
  advertisement,
  now,
  onEdit,
  onDelete,
}: {
  advertisement: OrganizationAdvertisementResponse
  now: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation()
  const status = advertisementStatus(advertisement, now)
  const url = safeAdvertisementUrl(advertisement.redirectUrl)
  const title = advertisement.title || t("advertisement.untitled")
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      {advertisement.videoUrl ? (
        <VideoPlayer
          src={advertisement.videoUrl}
          title={title}
          preload="none"
          className="rounded-none border-0 shadow-none"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-muted p-5 text-sm text-muted-foreground">
          {t("advertisement.videoUnavailable")}
        </div>
      )}
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : status === "scheduled" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}
          >
            {t(`advertisement.${status}`)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("advertisement.orderValue", {
              value: advertisement.sortOrder ?? 0,
            })}
          </span>
        </div>
        <h3 className="text-lg font-semibold break-words">{title}</h3>
        <dl className="space-y-2 text-xs">
          <div className="flex flex-wrap justify-between gap-1">
            <dt className="text-muted-foreground">
              {t("advertisement.startsAt")}
            </dt>
            <dd>
              {advertisement.startsAt
                ? formatAdvertisementDate(advertisement.startsAt, i18n.language)
                : t("advertisement.immediately")}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-1">
            <dt className="text-muted-foreground">
              {t("advertisement.endsAt")}
            </dt>
            <dd>
              {advertisement.endsAt
                ? formatAdvertisementDate(advertisement.endsAt, i18n.language)
                : t("advertisement.noEnd")}
            </dd>
          </div>
        </dl>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm text-primary underline-offset-4 hover:underline"
            title={url}
          >
            {url}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("advertisement.noLink")}
          </p>
        )}
        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
            disabled={advertisement.id === undefined}
          >
            {t("advertisement.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={advertisement.id === undefined}
          >
            {t("advertisement.delete")}
          </Button>
        </div>
      </div>
    </article>
  )
}
