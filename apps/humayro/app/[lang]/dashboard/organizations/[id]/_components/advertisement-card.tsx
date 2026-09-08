"use client"

import { useTranslation } from "react-i18next"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CalendarClockIcon,
  LinkSquare02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import type { OrganizationAdvertisementResponse } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
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
    <Card className="min-w-0 gap-4" size="sm">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={
              status === "published"
                ? "default"
                : status === "scheduled"
                  ? "outline"
                  : "secondary"
            }
          >
            {t(`advertisement.${status}`)}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("advertisement.orderValue", {
              value: advertisement.sortOrder ?? 0,
            })}
          </span>
        </div>
        <CardTitle className="truncate" title={title}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {advertisement.videoUrl ? (
          <VideoPlayer
            src={advertisement.videoUrl}
            title={title}
            preload="none"
            className="rounded-xl"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-muted p-5 text-sm text-muted-foreground">
            {t("advertisement.videoUnavailable")}
          </div>
        )}
        <div className="flex gap-2 text-xs leading-5">
          <HugeiconsIcon
            icon={CalendarClockIcon}
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div>
            <p>
              {advertisement.startsAt
                ? formatAdvertisementDate(advertisement.startsAt, i18n.language)
                : t("advertisement.immediately")}
            </p>
            <p className="text-muted-foreground">
              {advertisement.endsAt
                ? formatAdvertisementDate(advertisement.endsAt, i18n.language)
                : t("advertisement.noEnd")}
            </p>
          </div>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:underline"
            title={url}
          >
            <HugeiconsIcon
              icon={LinkSquare02Icon}
              className="size-4 shrink-0"
            />
            <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("advertisement.noLink")}
          </p>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={advertisement.id === undefined}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} />
          {t("advertisement.edit")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={advertisement.id === undefined}
        >
          {t("advertisement.delete")}
        </Button>
      </CardFooter>
    </Card>
  )
}
