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
      className={cn(
        "xs:size-9 3xl:size-12 size-8 shrink-0 rounded-full sm:size-10 lg:size-9 xl:size-10 2xl:size-11",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t(isDark ? "home.themeToLight" : "home.themeToDark")}
    >
      <HugeiconsIcon
        icon={isDark ? Sun01Icon : Moon01Icon}
        strokeWidth={1.8}
        className="xs:size-4 3xl:size-[22px] size-3.5 sm:size-[18px] 2xl:size-5"
      />
    </Button>
  )
}

export { ThemeToggle }
