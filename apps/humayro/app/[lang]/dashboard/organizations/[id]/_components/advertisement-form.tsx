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
import { VideoPlayer } from "@workspace/ui/components/video-player"
import {
  fromAdvertisementDateInput,
  MAX_ADVERTISEMENT_VIDEO_SIZE,
  safeAdvertisementUrl,
  toAdvertisementDateInput,
} from "./advertisement-helpers"

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
  const [error, setError] = useState<string>()
  const busy = pending || upload.isPending

  useEffect(() => {
    return () => { if (localPreview) URL.revokeObjectURL(localPreview) }
  }, [localPreview])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(undefined)
    const values = new FormData(event.currentTarget)
    const redirectUrl = String(values.get("redirectUrl") ?? "").trim()
    const startsAt = fromAdvertisementDateInput(
      String(values.get("startsAt") ?? "")
    )
    const endsAt = fromAdvertisementDateInput(
      String(values.get("endsAt") ?? "")
    )
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
    <form onSubmit={submit} className="space-y-5">
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-6 md:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border bg-muted/30 p-3">
            {preview ? (
              <VideoPlayer
                src={preview}
                title={title || t("advertisement.untitled")}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm text-muted-foreground">
                {t("advertisement.previewHint")}
              </div>
            )}
            <p className="mt-3 text-sm font-medium">
              {title || t("advertisement.untitled")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("advertisement.preview")}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-video`} className="text-sm font-medium">
              {t("advertisement.video")}
            </label>
            <Input
              id={`${id}-video`}
              type="file"
              accept="video/*"
              aria-describedby={`${id}-video-hint`}
              onChange={(event) => {
                const selected = event.target.files?.[0]
                if (!selected) return
                if (
                  !selected.type.startsWith("video/") ||
                  selected.size > MAX_ADVERTISEMENT_VIDEO_SIZE
                ) {
                  setError(t("advertisement.invalidVideo"))
                  event.target.value = ""
                  return
                }
                setFile(selected)
                setLocalPreview(URL.createObjectURL(selected))
                setError(undefined)
              }}
            />
            <p
              id={`${id}-video-hint`}
              className="text-xs leading-5 text-muted-foreground"
            >
              {t("advertisement.videoHint")}
            </p>
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <label htmlFor={`${id}-title`} className="text-sm font-medium">
              {t("advertisement.title")}
            </label>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={150}
              placeholder={t("advertisement.titlePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-url`} className="text-sm font-medium">
              {t("advertisement.redirectUrl")}
            </label>
            <Input
              id={`${id}-url`}
              name="redirectUrl"
              type="url"
              maxLength={1000}
              defaultValue={advertisement?.redirectUrl ?? ""}
              placeholder="https://t.me/your_brand"
            />
            <p className="text-xs text-muted-foreground">
              {t("advertisement.linkHint")}
            </p>
          </div>
          <div className="space-y-4 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">
                {t("advertisement.schedule")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("advertisement.timezone")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <label htmlFor={`${id}-start`} className="text-sm">
                  {t("advertisement.startsAt")}
                </label>
                <Input
                  id={`${id}-start`}
                  name="startsAt"
                  type="datetime-local"
                  step="1"
                  defaultValue={toAdvertisementDateInput(
                    advertisement?.startsAt
                  )}
                  className="min-w-0"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <label htmlFor={`${id}-end`} className="text-sm">
                  {t("advertisement.endsAt")}
                </label>
                <Input
                  id={`${id}-end`}
                  name="endsAt"
                  type="datetime-local"
                  step="1"
                  defaultValue={toAdvertisementDateInput(advertisement?.endsAt)}
                  className="min-w-0"
                />
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("advertisement.scheduleHint")}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-order`} className="text-sm font-medium">
              {t("advertisement.sortOrder")}
            </label>
            <Input
              id={`${id}-order`}
              name="sortOrder"
              type="number"
              min={0}
              max={2147483647}
              step={1}
              required
              defaultValue={advertisement?.sortOrder ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              {t("advertisement.orderHint")}
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="mt-1 size-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">
                {t("advertisement.active")}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {t("advertisement.activeHint")}
              </span>
            </span>
          </label>
        </div>
      </fieldset>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          {t("advertisement.cancel")}
        </Button>
        <Button type="submit" disabled={busy}>
          {upload.isPending
            ? t("advertisement.uploading")
            : pending
              ? t("advertisement.saving")
              : t("advertisement.save")}
        </Button>
      </div>
    </form>
  )
}
