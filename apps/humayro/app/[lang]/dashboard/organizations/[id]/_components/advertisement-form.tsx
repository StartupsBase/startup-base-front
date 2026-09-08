"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import type {
  OrganizationAdvertisementRequest,
  OrganizationAdvertisementResponse,
} from "@/lib/api"
import { useUploadVideo } from "@/lib/api/generated/attachment-controller/attachment-controller"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"
import { AdvertisementVideoUpload } from "./advertisement-video-upload"
import { AdvertisementSchedule } from "./advertisement-schedule"
import { VideoPlayer } from "@workspace/ui/components/video-player"
import { safeAdvertisementUrl } from "./advertisement-helpers"

export function AdvertisementForm({
  organizationId,
  advertisement,
  pending,
  onSave,
  onCancel,
}: {
  organizationId: number
  advertisement?: OrganizationAdvertisementResponse
  pending: boolean
  onSave: (data: OrganizationAdvertisementRequest) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const upload = useUploadVideo()
  const [file, setFile] = useState<File>()
  const [localPreview, setLocalPreview] = useState<string>()
  const [attachmentId, setAttachmentId] = useState(
    advertisement?.videoAttachmentId
  )
  const [uploadedUrl, setUploadedUrl] = useState(advertisement?.videoUrl)
  const [title, setTitle] = useState(advertisement?.title ?? "")
  const [active, setActive] = useState(advertisement?.active ?? true)
  const [startsAt, setStartsAt] = useState(advertisement?.startsAt)
  const [endsAt, setEndsAt] = useState(advertisement?.endsAt)
  const [error, setError] = useState<string>()
  const busy = pending || upload.isPending

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(undefined)
    const values = new FormData(event.currentTarget)
    const redirectUrl = String(values.get("redirectUrl") ?? "").trim()
    const sortOrder = Number(values.get("sortOrder"))
    if (redirectUrl && !safeAdvertisementUrl(redirectUrl)) {
      setError(t("advertisement.invalidUrl"))
      return
    }
    if (startsAt && endsAt && startsAt >= endsAt) {
      setError(t("advertisement.invalidDates"))
      return
    }
    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 2147483647
    ) {
      setError(t("advertisement.invalidOrder"))
      return
    }
    if (!file && attachmentId === undefined) {
      setError(t("advertisement.videoRequired"))
      return
    }
    try {
      let videoAttachmentId = attachmentId
      if (file) {
        const result = await upload.mutateAsync({
          params: { organizationId },
          data: { file },
        })
        if (result.id === undefined)
          throw new Error("Missing video attachment ID")
        videoAttachmentId = result.id
        // Retain a successful upload if saving the advertisement needs to be retried.
        setAttachmentId(result.id)
        setUploadedUrl(result.s3Url)
        setFile(undefined)
      }
      if (videoAttachmentId === undefined)
        throw new Error("Missing video attachment ID")
      await onSave({
        organizationId,
        videoAttachmentId,
        title: title.trim(),
        redirectUrl,
        active,
        sortOrder,
        startsAt,
        endsAt,
      })
    } catch {
      setError(t("advertisement.saveFailed"))
    }
  }

  const preview = localPreview ?? uploadedUrl
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <fieldset disabled={busy} className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("advertisement.mediaHeading")}</CardTitle>
              <CardDescription>
                {t("advertisement.mediaDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvertisementVideoUpload
                file={file}
                hasVideo={attachmentId !== undefined}
                disabled={busy}
                onSelect={(selected) => {
                  setFile(selected)
                  setLocalPreview(URL.createObjectURL(selected))
                  setError(undefined)
                }}
                onError={setError}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("advertisement.detailsHeading")}</CardTitle>
              <CardDescription>
                {t("advertisement.detailsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor={`${id}-title`}>
                  {t("advertisement.title")}
                </Label>
                <Input
                  id={`${id}-title`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  placeholder={t("advertisement.titlePlaceholder")}
                />
                <p className="text-right text-xs text-muted-foreground tabular-nums">
                  {title.length}/150
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-url`}>
                  {t("advertisement.redirectUrl")}
                </Label>
                <Input
                  id={`${id}-url`}
                  name="redirectUrl"
                  type="url"
                  maxLength={1000}
                  defaultValue={advertisement?.redirectUrl ?? ""}
                  placeholder="https://t.me/your_brand"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("advertisement.linkHint")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("advertisement.schedule")}</CardTitle>
              <CardDescription>{t("advertisement.timezone")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdvertisementSchedule
                startsAt={startsAt}
                endsAt={endsAt}
                onStartChange={setStartsAt}
                onEndChange={setEndsAt}
                disabled={busy}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {t("advertisement.scheduleHint")}
              </p>
            </CardContent>
          </Card>
        </fieldset>
        <aside className="min-w-0 space-y-6 xl:sticky xl:top-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("advertisement.preview")}</CardTitle>
              <CardDescription>
                {t("advertisement.previewDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview ? (
                <VideoPlayer
                  src={preview}
                  title={title || t("advertisement.untitled")}
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted px-6 text-center text-sm text-muted-foreground">
                  {t("advertisement.previewHint")}
                </div>
              )}
              <div className="space-y-2">
                <Badge variant={active ? "default" : "secondary"}>
                  {t(active ? "advertisement.enabled" : "advertisement.hidden")}
                </Badge>
                <p className="font-medium break-words">
                  {title || t("advertisement.untitled")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("advertisement.publishing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor={`${id}-active`}>
                  {t("advertisement.active")}
                </Label>
                <Switch
                  id={`${id}-active`}
                  checked={active}
                  onCheckedChange={setActive}
                  disabled={busy}
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("advertisement.activeHint")}
              </p>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor={`${id}-order`}>
                  {t("advertisement.sortOrder")}
                </Label>
                <Input
                  id={`${id}-order`}
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={2147483647}
                  step={1}
                  required
                  disabled={busy}
                  defaultValue={advertisement?.sortOrder ?? 0}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("advertisement.orderHint")}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <div className="sticky bottom-0 z-20 space-y-3 border-t bg-background/95 py-4 backdrop-blur-sm">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-xs text-muted-foreground">
            {t(busy ? "advertisement.savingHint" : "advertisement.saveHint")}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onCancel}
            >
              {t("advertisement.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {t(
                upload.isPending
                  ? "advertisement.uploading"
                  : pending
                    ? "advertisement.saving"
                    : "advertisement.save"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
