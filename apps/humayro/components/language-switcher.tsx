"use client"

import { usePathname, useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  isLanguage,
  languageFlags,
  languageLabels,
  type Language
} from "@/i18n/config"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

function getLocalizedPath(pathname: string, language: Language) {
  const segments = pathname.split("/")

  segments[1] = language

  return segments.join("/") || `/${language}`
}

function LanguageSwitcher({ language }: { language: Language }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)

  async function switchLanguage(nextLanguage: Language) {
    if (nextLanguage === language || isPending) {
      return
    }

    setIsPending(true)

    try {
     
      startTransition(() => {
        router.replace(getLocalizedPath(pathname, nextLanguage))
        router.refresh()
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={language}
        disabled={isPending}
        onValueChange={(value) => {
          if (isLanguage(value)) {
            void switchLanguage(value)
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className="min-w-0 gap-2 rounded-full border-border/70 bg-background/80 pr-2.5 pl-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
          aria-label={t("home.languageLabel")}
          hideIcon
        >
          <SelectValue>
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[13px] leading-none">
              <span aria-hidden="true">{languageFlags[language]}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-44 rounded-3xl p-1">
          <SelectItem value="ru" className="rounded-2xl py-2.5">
            <span className="min-w-0">
              <span className="block leading-none">{languageLabels.ru}</span>
            </span>
          </SelectItem>
          <SelectItem value="uz" className="rounded-2xl py-2.5">
            <span className="min-w-0">
              <span className="block leading-none">{languageLabels.uz}</span>
              
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export { LanguageSwitcher }
