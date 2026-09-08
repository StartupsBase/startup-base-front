"use client"

import { useSyncExternalStore } from "react"

export const GOOGLE_FONT_PRESETS = ["Inter", "Roboto", "Open Sans"] as const
type FontStatus = "idle" | "loading" | "ready" | "error"
const statuses = new Map<string, FontStatus>()
const requests = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()

export function isGoogleFontName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z][A-Za-z0-9 -]{0,79}$/.test(value) &&
    value === value.trim()
  )
}

function setStatus(name: string, status: FontStatus) {
  statuses.set(name, status)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useGoogleFontStatus(name: string | null) {
  return useSyncExternalStore(
    subscribe,
    () => (name ? (statuses.get(name) ?? "idle") : "idle"),
    () => "idle"
  )
}

export function loadGoogleFont(name: string): Promise<void> {
  if (!isGoogleFontName(name))
    return Promise.reject(new Error("Invalid font family"))
  const existing = requests.get(name)
  if (existing) return existing

  setStatus(name, "loading")
  const request = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${new URLSearchParams({ family: name, display: "swap" })}`
    link.dataset.googleFont = name
    let finished = false
    const timeout = window.setTimeout(
      () => finish(new Error("Font loading timed out")),
      15000
    )

    function finish(error?: Error) {
      if (finished) return
      finished = true
      window.clearTimeout(timeout)
      link.onload = null
      link.onerror = null
      if (error) {
        link.remove()
        reject(error)
      } else resolve()
    }

    link.onload = () => {
      void document.fonts.load(`16px "${name}"`).then(
        (faces) => {
          finish(
            faces.length ? undefined : new Error("Font family was not found")
          )
        },
        () => finish(new Error("Font could not be loaded"))
      )
    }
    link.onerror = () =>
      finish(new Error("Font stylesheet could not be loaded"))
    document.head.appendChild(link)
  }).then(
    () => {
      setStatus(name, "ready")
    },
    (error: unknown) => {
      requests.delete(name)
      setStatus(name, "error")
      throw error
    }
  )
  requests.set(name, request)
  return request
}
