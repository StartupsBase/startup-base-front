"use client"

import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload04Icon, Video01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@workspace/ui/components/attachment"
import { MAX_ADVERTISEMENT_VIDEO_SIZE } from "./advertisement-helpers"

export function AdvertisementVideoUpload({
  file,
  hasVideo,
  disabled,
  onSelect,
  onError,
}: {
  file?: File
  hasVideo: boolean
  disabled: boolean
  onSelect: (file: File) => void
  onError: (message: string) => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  function select(selected?: File) {
    if (!selected || disabled) return
    if (
      !selected.type.startsWith("video/") ||
      selected.size > MAX_ADVERTISEMENT_VIDEO_SIZE
    ) {
      onError(t("advertisement.invalidVideo"))
      return
    }
    onSelect(selected)
  }
  return (
    <div className="space-y-4">
      <input
        ref={input}
        type="file"
        accept="video/*"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("advertisement.video")}
        disabled={disabled}
        onChange={(event) => {
          select(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <Attachment
        state="idle"
        className={`w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center ${dragging ? "border-primary bg-primary/5" : "bg-muted/20"}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          select(event.dataTransfer.files[0])
        }}
      >
        <AttachmentMedia className="size-12 rounded-2xl bg-background ring-1 ring-border">
          <HugeiconsIcon icon={Upload04Icon} className="size-5" />
        </AttachmentMedia>
        <AttachmentContent className="flex-none">
          <AttachmentTitle>{t("advertisement.dropVideo")}</AttachmentTitle>
          <AttachmentDescription className="mt-2 whitespace-normal">
            {t("advertisement.uploadHint")}
          </AttachmentDescription>
        </AttachmentContent>
        <Button
          type="button"
          variant="outline"
          tabIndex={-1}
          disabled={disabled}
        >
          {t(
            hasVideo
              ? "advertisement.replaceVideo"
              : "advertisement.chooseVideo"
          )}
        </Button>
        <AttachmentTrigger
          aria-label={t(
            hasVideo
              ? "advertisement.replaceVideo"
              : "advertisement.chooseVideo"
          )}
          disabled={disabled}
          onClick={() => input.current?.click()}
        />
      </Attachment>
      {file || hasVideo ? (
        <Attachment className="w-full" state="done">
          <AttachmentMedia>
            <HugeiconsIcon icon={Video01Icon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {file?.name ?? t("advertisement.currentVideo")}
            </AttachmentTitle>
            <AttachmentDescription>
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : t("advertisement.keptVideo")}
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ) : null}
    </div>
  )
}
