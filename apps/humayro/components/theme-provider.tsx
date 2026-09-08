"use client"

import * as React from "react"

import {
  getPrimaryForeground,
  setInterfacePreferences,
  useInterfacePreferences,
  type ThemePreference,
} from "@/lib/interface-preferences"

type Theme = "light" | "dark"
type ThemeContextValue = {
  theme: Theme
  themePreference: ThemePreference
  setTheme: (theme: ThemePreference) => void
  setHostTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)
const systemThemeQuery = "(prefers-color-scheme: dark)"
const primaryProperties = [
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
]
const foregroundProperties = [
  "--primary-foreground",
  "--sidebar-primary-foreground",
]

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(systemThemeQuery)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function getSystemDark() {
  return window.matchMedia(systemThemeQuery).matches
}

function setTheme(theme: ThemePreference) {
  setInterfacePreferences({ theme })
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preferences = useInterfacePreferences()
  const [hostTheme, setHostTheme] = React.useState<Theme | null>(null)
  const systemDark = React.useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemDark,
    () => false
  )
  const theme: Theme =
    preferences.theme === "system"
      ? (hostTheme ?? (systemDark ? "dark" : "light"))
      : preferences.theme

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.style.colorScheme = theme

    for (const property of primaryProperties) {
      if (preferences.primaryColor)
        root.style.setProperty(property, preferences.primaryColor)
      else root.style.removeProperty(property)
    }
    for (const property of foregroundProperties) {
      if (preferences.primaryColor)
        root.style.setProperty(
          property,
          getPrimaryForeground(preferences.primaryColor)
        )
      else root.style.removeProperty(property)
    }
  }, [theme, preferences.primaryColor])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return
      if (typeof event.key !== "string" || event.key.toLowerCase() !== "d")
        return
      if (isTypingTarget(event.target)) return
      setTheme(theme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [theme])

  const value = React.useMemo(
    () => ({
      theme,
      themePreference: preferences.theme,
      setTheme,
      setHostTheme,
    }),
    [theme, preferences.theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}

export { ThemeProvider, useTheme }
