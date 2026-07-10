"use client"

import * as React from "react"

type Theme = "light" | "dark"
type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const storageKey = "humayro-theme"
const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
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
  const [theme, setCurrentTheme] = React.useState<Theme>("light")

  const setTheme = React.useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(storageKey, nextTheme)
    applyTheme(nextTheme)
    themeRef.current = nextTheme
    setCurrentTheme(nextTheme)
  }, [])

  React.useEffect(() => {
    const initialTheme = getStoredTheme() ?? getSystemTheme()

    applyTheme(initialTheme)
    themeRef.current = initialTheme
    setCurrentTheme(initialTheme)
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
      setCurrentTheme(nextTheme)
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

  const value = React.useMemo(() => ({ theme, setTheme }), [setTheme, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
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

function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}

export { ThemeProvider, useTheme }
