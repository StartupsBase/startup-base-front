"use client"

import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      className={cn(
        "flex size-8 aspect-square shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-input/30 transition-colors hover:bg-input/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none xs:size-9 sm:size-10 lg:size-9 xl:size-10 2xl:size-11 3xl:size-12",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t(isDark ? "home.themeToLight" : "home.themeToDark")}
    >
      <HugeiconsIcon
        icon={isDark ? Sun01Icon : Moon01Icon}
        strokeWidth={2}
        className="size-4.5 sm:size-5 2xl:size-5.5"
      />
    </button>
  )
}

export { ThemeToggle }
