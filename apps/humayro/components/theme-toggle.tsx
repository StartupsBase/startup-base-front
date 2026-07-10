"use client"

import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t(isDark ? "home.themeToLight" : "home.themeToDark")}
    >
      <HugeiconsIcon
        icon={isDark ? Sun01Icon : Moon01Icon}
        strokeWidth={1.8}
        className="size-4"
      />
    </Button>
  )
}

export { ThemeToggle }
