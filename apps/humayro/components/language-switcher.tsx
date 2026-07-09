"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import {
  languageLabels,
  languages,
  type Language,
} from "@/i18n/config"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

function getLocalizedPath(pathname: string, language: Language) {
  const segments = pathname.split("/")

  segments[1] = language

  return segments.join("/") || `/${language}`
}

function LanguageSwitcher({ language }: { language: Language }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  async function switchLanguage(nextLanguage: Language) {
    await fetch("/api/language", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ language: nextLanguage }),
    })

    router.replace(getLocalizedPath(pathname, nextLanguage))
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">
        {t("home.languageLabel")}
      </span>
      <div className="inline-flex rounded-4xl border border-border bg-input/30 p-1">
        {languages.map((item) => (
          <Button
            key={item}
            type="button"
            variant={item === language ? "default" : "ghost"}
            size="sm"
            className={cn("h-7 rounded-4xl px-3", item !== language && "text-muted-foreground")}
            onClick={() => {
              void switchLanguage(item)
            }}
          >
            {languageLabels[item]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { LanguageSwitcher }
