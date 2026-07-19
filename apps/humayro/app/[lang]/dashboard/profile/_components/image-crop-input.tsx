"use client"

import * as React from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Slider } from "@workspace/ui/components/slider"

type ImageCropInputProps = {
  disabled?: boolean
  cropShape?: "rect" | "round"
  fileName?: string
  onChange: (file: File) => void
  translationPrefix?: "organization.logoCrop" | "profile.crop"
}

export function ImageCropInput({
  cropShape = "round",
  disabled,
  fileName = "profile-photo",
  onChange,
  translationPrefix = "profile.crop",
}: ImageCropInputProps) {
  const { t } = useTranslation()
  const galleryInput = React.useRef<HTMLInputElement>(null)
  const cameraInput = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [sourceUrl, setSourceUrl] = React.useState<string | null>(null)
  const [sourceName, setSourceName] = React.useState(fileName)
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [croppedArea, setCroppedArea] = React.useState<Area | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [error, setError] = React.useState(false)

  React.useEffect(
    () => () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    },
    [sourceUrl]
  )

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setSourceUrl(URL.createObjectURL(file))
    setSourceName(file.name.replace(/\.[^.]+$/, "") || fileName)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedArea(null)
    setError(false)
    setOpen(true)
  }

  function closeCropper() {
    setOpen(false)
    setError(false)
  }

  async function applyCrop() {
    if (!sourceUrl || !croppedArea) return

    setProcessing(true)
    setError(false)

    try {
      const file = await createCroppedImage(
        sourceUrl,
        croppedArea,
        rotation,
        `${sourceName}.jpg`
      )
      onChange(file)
      setOpen(false)
    } catch {
      setError(true)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => galleryInput.current?.click()}
        >
          {t(`${translationPrefix}.choosePhoto`)}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="sm:hidden"
          onClick={() => cameraInput.current?.click()}
        >
          {t(`${translationPrefix}.takePhoto`)}
        </Button>
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={selectImage}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={selectImage}
        />
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : closeCropper())}
      >
        <DialogContent className="sm:max-w-xl data-open:zoom-in-100 data-closed:zoom-out-100">
          <DialogHeader>
            <DialogTitle>{t(`${translationPrefix}.title`)}</DialogTitle>
            <DialogDescription>
              {t(`${translationPrefix}.description`)}
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-[min(55vh,28rem)] min-h-72 overflow-hidden rounded-3xl bg-black">
            {sourceUrl ? (
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape={cropShape}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, pixels) => setCroppedArea(pixels)}
              />
            ) : null}
          </div>

          <div className="grid gap-4">
            <Control
              label={t(`${translationPrefix}.zoom`)}
              value={Math.round(zoom * 100)}
            >
              <Slider
                min={1}
                max={3}
                step={0.01}
                value={[zoom]}
                onValueChange={([value]) => setZoom(value ?? 1)}
              />
            </Control>
            <Control
              label={t(`${translationPrefix}.rotation`)}
              value={`${rotation}°`}
            >
              <Slider
                min={-180}
                max={180}
                step={1}
                value={[rotation]}
                onValueChange={([value]) => setRotation(value ?? 0)}
              />
            </Control>
          </div>

          {error ? (
            <p className="text-sm text-destructive">
              {t(`${translationPrefix}.failed`)}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeCropper}
              disabled={processing}
            >
              {t(`${translationPrefix}.cancel`)}
            </Button>
            <Button
              type="button"
              onClick={applyCrop}
              disabled={processing || !croppedArea}
            >
              {processing
                ? t(`${translationPrefix}.processing`)
                : t(`${translationPrefix}.apply`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Control({
  children,
  label,
  value,
}: {
  children: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      {children}
    </div>
  )
}

async function createCroppedImage(
  source: string,
  crop: Area,
  rotation: number,
  fileName: string
) {
  const image = await loadImage(source)
  const radians = (rotation * Math.PI) / 180
  const boundingWidth =
    Math.abs(Math.cos(radians) * image.width) +
    Math.abs(Math.sin(radians) * image.height)
  const boundingHeight =
    Math.abs(Math.sin(radians) * image.width) +
    Math.abs(Math.cos(radians) * image.height)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) throw new Error("Canvas is unavailable")

  canvas.width = boundingWidth
  canvas.height = boundingHeight
  context.translate(boundingWidth / 2, boundingHeight / 2)
  context.rotate(radians)
  context.drawImage(image, -image.width / 2, -image.height / 2)

  const output = document.createElement("canvas")
  const outputContext = output.getContext("2d")

  if (!outputContext) throw new Error("Canvas is unavailable")

  output.width = crop.width
  output.height = crop.height
  outputContext.drawImage(
    canvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    output.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Image export failed")),
      "image/jpeg",
      0.92
    )
  })

  return new File([blob], fileName, { type: blob.type })
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Image loading failed"))
    image.src = source
  })
}
