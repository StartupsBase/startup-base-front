"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { YANDEX_MAPS_API_KEY } from "@/lib/constants"
import type { MapCoordinates } from "./leaflet-location-map"
import {
  loadYandexMaps,
  type YandexCoordinates,
  type YandexMap,
  type YandexPlacemark,
} from "./ymaps-helper"

type YandexLocationMapProps = {
  value?: MapCoordinates
  onLocationChange: (coordinates: MapCoordinates) => void
}

const tashkent: MapCoordinates = { latitude: 41.2995, longitude: 69.2401 }

function isValidCoordinates(coords: unknown): coords is YandexCoordinates {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === "number" &&
    Number.isFinite(coords[0]) &&
    typeof coords[1] === "number" &&
    Number.isFinite(coords[1]) &&
    Math.abs(coords[0]) <= 90 &&
    Math.abs(coords[1]) <= 180
  )
}

export function YandexLocationMap({
  value,
  onLocationChange,
}: YandexLocationMapProps) {
  const { t } = useTranslation()
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YandexMap | null>(null)
  const markerRef = useRef<YandexPlacemark | null>(null)
  const onLocationChangeRef = useRef(onLocationChange)
  const locationRef = useRef(value ?? tashkent)
  const geolocationRequestRef = useRef(0)
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [attempt, setAttempt] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const apiKey =
    process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || YANDEX_MAPS_API_KEY
  const latitude = value?.latitude ?? tashkent.latitude
  const longitude = value?.longitude ?? tashkent.longitude

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    const coords: YandexCoordinates = [latitude, longitude]
    if (!isValidCoordinates(coords)) return
    locationRef.current = { latitude, longitude }
    const current = markerRef.current?.geometry.getCoordinates()
    if (current?.[0] === coords[0] && current[1] === coords[1]) return
    markerRef.current?.geometry.setCoordinates(coords)
    mapRef.current?.setCenter(coords)
  }, [latitude, longitude])

  useEffect(() => {
    let cancelled = false
    let map: YandexMap | undefined
    let observer: ResizeObserver | undefined
    let frame = 0
    let removeListeners: (() => void) | undefined

    function disposeMap() {
      observer?.disconnect()
      window.cancelAnimationFrame(frame)
      removeListeners?.()
      removeListeners = undefined
      map?.destroy()
      map = undefined
      mapRef.current = null
      markerRef.current = null
    }

    void loadYandexMaps(apiKey)
      .then((ymaps) => {
        if (cancelled || !mapElementRef.current) return
        const location = locationRef.current
        const candidate: YandexCoordinates = [
          location.latitude,
          location.longitude,
        ]
        const center: YandexCoordinates = isValidCoordinates(candidate)
          ? candidate
          : [tashkent.latitude, tashkent.longitude]
        map = new ymaps.Map(mapElementRef.current, {
          center,
          zoom: 12,
          controls: ["zoomControl"],
        })
        mapRef.current = map
        map.behaviors.disable("scrollZoom")
        const marker = new ymaps.Placemark(
          center,
          {},
          {
            draggable: true,
            preset: "islands#blueDotIcon",
          }
        )
        markerRef.current = marker
        map.geoObjects.add(marker)

        const selectLocation = (coords: unknown) => {
          if (cancelled || !isValidCoordinates(coords)) return
          // A late geolocation response must not overwrite a newer manual choice.
          geolocationRequestRef.current += 1
          setIsLocating(false)
          setLocationError(false)
          marker.geometry.setCoordinates(coords)
          onLocationChangeRef.current({
            latitude: coords[0],
            longitude: coords[1],
          })
        }
        const onClick = (event: { get(name: string): unknown }) =>
          selectLocation(event.get("coords"))
        const onDragEnd = () => selectLocation(marker.geometry.getCoordinates())
        map.events.add("click", onClick)
        marker.events.add("dragend", onDragEnd)
        removeListeners = () => {
          map?.events.remove("click", onClick)
          marker.events.remove("dragend", onDragEnd)
        }

        const fitToViewport = () => {
          window.cancelAnimationFrame(frame)
          frame = window.requestAnimationFrame(() => {
            if (!cancelled) map?.container.fitToViewport()
          })
        }
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(fitToViewport)
          observer.observe(mapElementRef.current)
        }
        fitToViewport()
        setMapState("ready")
      })
      .catch(() => {
        if (cancelled) return
        disposeMap()
        setMapState("error")
      })

    return () => {
      cancelled = true
      geolocationRequestRef.current += 1
      disposeMap()
    }
  }, [apiKey, attempt])

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    const request = ++geolocationRequestRef.current
    setIsLocating(true)
    setLocationError(false)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        if (request !== geolocationRequestRef.current || !mapRef.current) return
        setIsLocating(false)
        const coords: YandexCoordinates = [latitude, longitude]
        if (!isValidCoordinates(coords)) {
          setLocationError(true)
          return
        }
        markerRef.current?.geometry.setCoordinates(coords)
        mapRef.current.setCenter(coords, 17)
        onLocationChangeRef.current({ latitude, longitude })
      },
      () => {
        if (request !== geolocationRequestRef.current) return
        setIsLocating(false)
        setLocationError(true)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    )
  }

  return (
    <div
      className="relative h-80 w-full overflow-hidden rounded-xl border"
      aria-label={t("mapPicker.title")}
      aria-busy={mapState === "loading"}
    >
      <div ref={mapElementRef} className="h-full w-full" />
      {mapState === "ready" && (
        <div className="absolute top-3 right-3 z-10 flex max-w-[75%] flex-col items-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isLocating}
            onClick={locateUser}
          >
            {t(isLocating ? "mapPicker.geolocating" : "mapPicker.myLocation")}
          </Button>
          {locationError && (
            <p
              role="alert"
              className="rounded-lg bg-background p-2 text-sm text-destructive shadow"
            >
              {t("mapPicker.geolocationError")}
            </p>
          )}
        </div>
      )}
      {mapState === "loading" && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground"
        >
          {t("mapPicker.loading")}
        </div>
      )}
      {mapState === "error" && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center text-sm"
        >
          <p className="text-destructive">{t("mapPicker.loadError")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMapState("loading")
              setAttempt((current) => current + 1)
            }}
          >
            {t("mapPicker.retry")}
          </Button>
        </div>
      )}
    </div>
  )
}
