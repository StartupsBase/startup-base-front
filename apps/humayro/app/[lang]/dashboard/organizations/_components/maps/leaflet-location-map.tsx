"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { divIcon, type LatLngExpression } from "leaflet"
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export type MapCoordinates = {
  latitude: number
  longitude: number
}

type LeafletLocationMapProps = {
  value?: MapCoordinates
  onLocationChange: (coordinates: MapCoordinates) => void
}

const tashkent: MapCoordinates = { latitude: 41.2995, longitude: 69.2401 }

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    district?: string
    state?: string
    country?: string
  }
}

function getResultLabel({ properties }: PhotonFeature) {
  const street = [properties.street, properties.housenumber]
    .filter(Boolean)
    .join(" ")

  return [
    properties.name,
    street,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(", ")
}

const pinIcon = divIcon({
  className: "",
  html: '<span class="flex size-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-primary-foreground shadow-lg">•</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

function MapClickHandler({
  onLocationChange,
}: Pick<LeafletLocationMapProps, "onLocationChange">) {
  useMapEvents({
    click(event) {
      onLocationChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    },
  })

  return null
}

function RecenterMap({ value }: { value: MapCoordinates }) {
  const map = useMap()

  useEffect(() => {
    map.setView([value.latitude, value.longitude], map.getZoom())
  }, [map, value.latitude, value.longitude])

  return null
}

export function LeafletLocationMap({
  value,
  onLocationChange,
}: LeafletLocationMapProps) {
  const { t } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const location = value ?? tashkent
  const center: LatLngExpression = [location.latitude, location.longitude]

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (!searchOpen || normalizedQuery.length < 2) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError(false)

      try {
        const params = new URLSearchParams({
          q: normalizedQuery,
          limit: "6",
          countrycode: "UZ",
          lon: String(location.longitude),
          lat: String(location.latitude),
        })
        const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Location search failed")

        const data = (await response.json()) as { features?: PhotonFeature[] }
        setResults(data.features ?? [])
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([])
          setSearchError(true)
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [location.latitude, location.longitude, query, searchOpen])

  function selectResult(result: PhotonFeature) {
    const [longitude, latitude] = result.geometry.coordinates
    setQuery(getResultLabel(result))
    setResults([])
    setSearchOpen(false)
    onLocationChange({ latitude, longitude })
  }

  return (
    <div className="relative h-80 w-full">
      <div className="absolute top-3 right-3 left-3 z-1000 flex justify-end">
        {searchOpen ? (
          <div className="w-full max-w-md rounded-xl border bg-background p-2 shadow-lg">
            <div className="flex gap-2">
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("mapPicker.searchPlaceholder")}
                aria-label={t("mapPicker.searchPlaceholder")}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t("mapPicker.closeSearch")}
                onClick={() => setSearchOpen(false)}
              >
                ×
              </Button>
            </div>
            {query.trim().length >= 2 ? (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {t("mapPicker.searching")}
                  </p>
                ) : searchError ? (
                  <p className="px-3 py-2 text-sm text-destructive">
                    {t("mapPicker.searchError")}
                  </p>
                ) : results.length ? (
                  results.map((result, index) => (
                    <button
                      key={`${result.geometry.coordinates.join("-")}-${index}`}
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => selectResult(result)}
                    >
                      {getResultLabel(result)}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {t("mapPicker.noSearchResults")}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <Button
            type="button"
            size="icon"
            className="shadow-lg"
            aria-label={t("mapPicker.openSearch")}
            onClick={() => setSearchOpen(true)}
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </Button>
        )}
      </div>
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full rounded-xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationChange={onLocationChange} />
        <RecenterMap value={location} />
        <Marker position={center} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}
