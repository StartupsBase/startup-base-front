"use client"

import { useEffect, useRef, useState } from "react"

import type { MapCoordinates } from "@/components/maps/leaflet-location-map"

type YandexLocationMapProps = {
  value?: MapCoordinates
  onLocationChange: (coordinates: MapCoordinates) => void
}

type YandexWindow = Window & { ymaps3?: any }

const tashkent: MapCoordinates = { latitude: 41.2995, longitude: 69.2401 }

function loadYandexMaps(apiKey: string) {
  const windowWithYandex = window as YandexWindow

  if (windowWithYandex.ymaps3) return Promise.resolve(windowWithYandex.ymaps3)

  return new Promise<any>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-yandex-maps="v3"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve((window as YandexWindow).ymaps3), { once: true })
      existingScript.addEventListener("error", reject, { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`
    script.async = true
    script.dataset.yandexMaps = "v3"
    script.onload = () => resolve((window as YandexWindow).ymaps3)
    script.onerror = () => reject(new Error("Unable to load Yandex Maps."))
    document.head.appendChild(script)
  })
}

export function YandexLocationMap({ value, onLocationChange }: YandexLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onLocationChangeRef = useRef(onLocationChange)
  const [error, setError] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    if (!apiKey || !containerRef.current) return

    let disposed = false
    let map: any

    void loadYandexMaps(apiKey)
      .then(async (ymaps3) => {
        await ymaps3.ready
        if (disposed || !containerRef.current) return

        const { YMap, YMapDefaultSchemeLayer, YMapListener, YMapMarker } = ymaps3
        const point = value ?? tashkent
        map = new YMap(containerRef.current, {
          location: { center: [point.longitude, point.latitude], zoom: 12 },
        })
        map.addChild(new YMapDefaultSchemeLayer())

        const markerElement = document.createElement("div")
        markerElement.className = "flex size-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-primary-foreground shadow-lg"
        markerElement.textContent = "•"
        const marker = new YMapMarker({ coordinates: [point.longitude, point.latitude] }, markerElement)
        map.addChild(marker)
        map.addChild(
          new YMapListener({
            layer: "any",
            onClick: (event: { coordinates?: [number, number] }) => {
              if (!event.coordinates) return
              const [longitude, latitude] = event.coordinates
              marker.update({ coordinates: [longitude, latitude] })
              onLocationChangeRef.current({ latitude, longitude })
            },
          })
        )
      })
      .catch(() => setError(true))

    return () => {
      disposed = true
      map?.destroy?.()
    }
  }, [apiKey, value?.latitude, value?.longitude])

  if (!apiKey) {
    return <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Yandex Maps API key is not configured.</p>
  }

  if (error) {
    return <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Yandex Maps could not be loaded.</p>
  }

  return <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-xl" />
}
