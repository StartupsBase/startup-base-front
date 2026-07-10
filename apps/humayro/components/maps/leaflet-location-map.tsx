"use client"

import { useEffect } from "react"
import { divIcon, type LatLngExpression } from "leaflet"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"

export type MapCoordinates = {
  latitude: number
  longitude: number
}

type LeafletLocationMapProps = {
  value?: MapCoordinates
  onLocationChange: (coordinates: MapCoordinates) => void
}

const tashkent: MapCoordinates = { latitude: 41.2995, longitude: 69.2401 }

const pinIcon = divIcon({
  className: "",
  html: '<span class="flex size-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-primary-foreground shadow-lg">•</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

function MapClickHandler({ onLocationChange }: Pick<LeafletLocationMapProps, "onLocationChange">) {
  useMapEvents({
    click(event) {
      onLocationChange({ latitude: event.latlng.lat, longitude: event.latlng.lng })
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

export function LeafletLocationMap({ value, onLocationChange }: LeafletLocationMapProps) {
  const location = value ?? tashkent
  const center: LatLngExpression = [location.latitude, location.longitude]

  return (
    <MapContainer center={center} zoom={12} className="h-80 w-full rounded-xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationChange={onLocationChange} />
      <RecenterMap value={location} />
      <Marker position={center} icon={pinIcon} />
    </MapContainer>
  )
}
