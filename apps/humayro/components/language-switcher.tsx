"use client"

import { usePathname, useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  languageFlags,
  languageLabels,
  languages,
  type Language
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
      <DropdownMenuTrigger asChild className={cn("cursor-pointer", className)}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
          <div className="flex items-center justify-center overflow-hidden rounded-full">
            <Image
              width={40}
              quality={1000}
              height={40}
              src={languageFlags[language]}
              alt={languageLabels[language]}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>
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
