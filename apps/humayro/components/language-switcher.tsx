"use client"

import { usePathname, useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  languageFlags,
  languageLabels,
  languages,
  type Language,
} from "@/i18n/config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"

function getLocalizedPath(pathname: string, language: Language) {
  const segments = pathname.split("/")

  segments[1] = language

  return segments.join("/") || `/${language}`
}

function LanguageSwitcher({
  language,
  className,
}: {
  language: Language
  className?: string
}) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={languageLabels[language]}
          className={cn(
            "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 p-1 transition-colors duration-200 hover:bg-gray-200",
            "xs:size-9 2xs:p-1.5 3xl:size-12 sm:size-10 lg:size-9 xl:size-10 2xl:size-11",
            "dark:bg-gray-800 dark:hover:bg-gray-700",
            className
          )}
        >
          <span className="flex size-full items-center justify-center overflow-hidden rounded-full">
            <Image
              width={40}
              quality={90}
              height={40}
              src={languageFlags[language]}
              alt={languageLabels[language]}
              className="size-full rounded-full object-cover"
            />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-32 rounded-md border shadow-lg dark:shadow-xl"
        align="center"
        sideOffset={5}
      >
        <DropdownMenuGroup>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang}
              className={cn(
                "flex w-full cursor-pointer items-center justify-start gap-2 rounded-sm outline-none focus:text-primary",
                "px-3 py-2",
                "dark:hover:bg-accent-dark hover:bg-accent",
                "transition-colors duration-150",
                language === lang
                  ? "dark:text-primary-li ght bg-primary/10 text-primary dark:bg-primary/20"
                  : "dark:text-foreground-dark text-foreground",
                "dark:focus:bg-accent-dark dark:focus:text-primary-light focus:bg-accent focus:text-primary"
              )}
              onClick={() => switchLanguage(lang)}
            >
              <Image
                width={20}
                height={20}
                src={languageFlags[lang]}
                alt={languageLabels[lang]}
                className="h-5 w-5 rounded-full object-cover"
              />
              <p className="text-sm font-medium">{t(languageLabels[lang])}</p>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LanguageSwitcher }
