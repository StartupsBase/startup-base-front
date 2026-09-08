"use client"

import { useMemo, useSyncExternalStore } from "react"
import { isGoogleFontName } from "@/lib/google-fonts"

export type ThemePreference = "light" | "dark" | "system"
export const FONT_SIZES = {
  SMALL: "87.5%",
  MEDIUM: "100%",
  LARGE: "112.5%",
} as const
export type FontSize = keyof typeof FONT_SIZES
export const FONT_SIZE_OPTIONS = Object.keys(FONT_SIZES) as FontSize[]

export const FONT_FAMILIES = {
  PLATFORM: null,
  SYSTEM: "system-ui, sans-serif",
  MACOS:
    '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  GOOGLE: null,
} as const
export type FontFamily = keyof typeof FONT_FAMILIES

export function isFontFamily(value: unknown): value is FontFamily {
  return typeof value === "string" && Object.hasOwn(FONT_FAMILIES, value)
}

type InterfacePreferences = {
  theme: ThemePreference
  fontSize: FontSize
  fontFamily: FontFamily
  googleFont: string
  sidebarAutoHide: boolean
  primaryColor: string | null
}

const STORAGE_KEY = "humayro-interface-preferences"
const CHANGE_EVENT = "humayro-interface-preferences-change"
const defaults: InterfacePreferences = {
  theme: "system",
  fontSize: "MEDIUM",
  fontFamily: "PLATFORM",
  googleFont: "Inter",
  sidebarAutoHide: true,
  primaryColor: null,
}
let memorySnapshot: string | null = null

export function isPrimaryColor(value: unknown): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
}

function getSnapshot() {
  if (memorySnapshot !== null) return memorySnapshot
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved !== null) return saved
    // Keep the appearance chosen with the existing header theme toggle.
    const legacyTheme = window.localStorage.getItem("humayro-theme")
    if (legacyTheme === "light" || legacyTheme === "dark") {
      return JSON.stringify({ ...defaults, theme: legacyTheme })
    }
  } catch {
    // Preferences still work for this page when browser storage is unavailable.
  }
  return memorySnapshot
}

function parsePreferences(snapshot: string | null): InterfacePreferences {
  try {
    const value = snapshot ? JSON.parse(snapshot) : null
    if (!value || typeof value !== "object") return defaults
    return {
      theme:
        value.theme === "light" || value.theme === "dark"
          ? value.theme
          : "system",
      fontSize:
        value.fontSize === "SMALL" || value.fontSize === "LARGE"
          ? value.fontSize
          : "MEDIUM",
      fontFamily: isFontFamily(value.fontFamily)
        ? value.fontFamily
        : "PLATFORM",
      googleFont: isGoogleFontName(value.googleFont)
        ? value.googleFont
        : "Inter",
      sidebarAutoHide:
        typeof value.sidebarAutoHide === "boolean"
          ? value.sidebarAutoHide
          : true,
      primaryColor: isPrimaryColor(value.primaryColor)
        ? value.primaryColor
        : null,
    }
  } catch {
    return defaults
  }
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (
      event.key === null ||
      event.key === STORAGE_KEY ||
      event.key === "humayro-theme"
    )
      onChange()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

export function setInterfacePreferences(patch: Partial<InterfacePreferences>) {
  const next = parsePreferences(
    JSON.stringify({ ...parsePreferences(getSnapshot()), ...patch })
  )
  memorySnapshot = JSON.stringify(next)
  try {
    window.localStorage.setItem(STORAGE_KEY, memorySnapshot)
    memorySnapshot = null
  } catch {
    // In-memory settings remain usable without localStorage.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useInterfacePreferences() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null)
  return useMemo(() => parsePreferences(snapshot), [snapshot])
}

export function getPrimaryForeground(color: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance =
    0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff"
}
