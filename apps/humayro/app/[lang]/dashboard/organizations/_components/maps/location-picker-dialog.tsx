"use client"

import { useCallback, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import type { MapCoordinates } from "./leaflet-location-map"

const LeafletLocationMap = dynamic(
  () =>
    import("./leaflet-location-map").then(
      (module) => module.LeafletLocationMap
    ),
  { ssr: false, loading: () => <MapLoading /> }
)

const YandexLocationMap = dynamic(
  () =>
    import("./yandex-location-map").then((module) => module.YandexLocationMap),
  { ssr: false, loading: () => <MapLoading /> }
)

type LocationPickerDialogProps = {
  onSelect: (address: string, coordinates: MapCoordinates) => void
}

type SelectedLocation = MapCoordinates & { address: string }

async function resolveAddress({ latitude, longitude }: MapCoordinates) {
  const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    )
    const result = (await response.json()) as { display_name?: string }
    return result.display_name || fallback
  } catch {
    return fallback
  }
}

export function LocationPickerDialog({ onSelect }: LocationPickerDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<"yandex" | "other">("yandex")
  const [selected, setSelected] = useState<SelectedLocation | null>(null)
  const locationRequestRef = useRef(0)

  const handleLocationChange = useCallback(
    async (coordinates: MapCoordinates) => {
      const requestId = locationRequestRef.current + 1
      locationRequestRef.current = requestId
      setSelected({ ...coordinates, address: t("mapPicker.locating") })
      const address = await resolveAddress(coordinates)
      if (locationRequestRef.current === requestId) {
        setSelected({ ...coordinates, address })
      }
    },
    [t]
  )

  function confirmLocation() {
    if (!selected) return
    onSelect(selected.address, {
      latitude: selected.latitude,
      longitude: selected.longitude,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="shrink-0">
          {t("mapPicker.choose")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("mapPicker.title")}</DialogTitle>
          <DialogDescription>{t("mapPicker.description")}</DialogDescription>
        </DialogHeader>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("mapPicker.title")}
        >
          <Button
            type="button"
            variant={provider === "yandex" ? "default" : "outline"}
            onClick={() => setProvider("yandex")}
          >
            {t("mapPicker.yandex")}
          </Button>
          <Button
            type="button"
            variant={provider === "other" ? "default" : "outline"}
            onClick={() => setProvider("other")}
          >
            {t("mapPicker.other")}
          </Button>
        </div>
        {provider === "yandex" ? (
          <YandexLocationMap
            value={selected ?? undefined}
            onLocationChange={handleLocationChange}
          />
        ) : (
          <LeafletLocationMap
            value={selected ?? undefined}
            onLocationChange={handleLocationChange}
          />
        )}
        <p className="min-h-5 text-sm text-muted-foreground">
          {selected
            ? `${t("mapPicker.selected")}: ${selected.address}`
            : t("mapPicker.clickToSelect")}
        </p>
        <DialogFooter>
          <Button
            type="button"
            onClick={confirmLocation}
            disabled={!selected || selected.address === t("mapPicker.locating")}
          >
            {t("mapPicker.useAddress")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MapLoading() {
  return (
    <div className="flex h-80 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  )
}
