"use client"

import * as React from "react"

type Theme = "light" | "dark"

const storageKey = "humayro-theme"

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredTheme(): Theme | null {
  const theme = window.localStorage.getItem(storageKey)

  return theme === "light" || theme === "dark" ? theme : null
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeRef = React.useRef<Theme>("light")

  const setTheme = React.useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(storageKey, nextTheme)
    applyTheme(nextTheme)
    themeRef.current = nextTheme
  }, [])

  React.useEffect(() => {
    const initialTheme = getStoredTheme() ?? getSystemTheme()

    applyTheme(initialTheme)
    themeRef.current = initialTheme
  }, [])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    function onSystemThemeChange() {
      if (getStoredTheme()) {
        return
      }

      const nextTheme = getSystemTheme()
      applyTheme(nextTheme)
      themeRef.current = nextTheme
    }

    media.addEventListener("change", onSystemThemeChange)

    return () => {
      media.removeEventListener("change", onSystemThemeChange)
    }
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(themeRef.current === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [setTheme])

  return children
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export { ThemeProvider }
