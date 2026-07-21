"use client"

import { usePathname } from "next/navigation"
import type { Language } from "@/i18n/config"
import { SearchList01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { LogoBrand } from "@/components/logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "./user-dropdown"
import { Button } from "@workspace/ui/components/button"
import { AdvancedSearch } from "./advanced-search"
import { StorefrontNavActions } from "./storefront/storefront-nav-actions"

export default function Header({ language }: { language: Language }) {
  const pathname = usePathname()
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  ) {
    return null
  }

  return (
    <header
      className={`sticky top-0 z-50 mx-auto flex items-center justify-between border transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] sm:top-2 dark:border-none ${
        isSticky
          ? "w-[calc(100%-0.5rem)] rounded-2xl bg-white/15 p-2 backdrop-blur sm:w-[calc(100%-4rem)] sm:max-w-345 sm:rounded-4xl dark:bg-primary/15"
          : "w-full rounded-none border-x-0 border-t-0 bg-white/15 p-2 shadow-none backdrop-blur sm:w-[calc(100%-2rem)] sm:max-w-[1580px] sm:border-none sm:bg-transparent sm:backdrop-blur-none dark:bg-primary/15 sm:dark:bg-transparent"
      } `}
    >
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 sm:flex sm:justify-between sm:gap-0 sm:px-4">
        <LogoBrand className="max-[299px]:[&>span]:sr-only" />

        <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 sm:col-auto sm:row-auto sm:w-auto">
          <Button
            aria-label="Katalog"
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] px-0 sm:h-11 sm:w-auto sm:rounded-[12px] sm:px-4"
          >
            <HugeiconsIcon icon={SearchList01Icon} className="size-5" />
            <span className="sr-only sm:not-sr-only">Katalog</span>
          </Button>
          <AdvancedSearch language={language} />
        </div>
        <div className="xs:gap-1 col-start-2 row-start-1 flex min-w-0 items-center justify-end gap-0.5 sm:col-auto sm:row-auto sm:gap-2">
          <LanguageSwitcher language={language} />
          <ThemeToggle />
          <StorefrontNavActions language={language} />
          <UserDropdown language={language} />
        </div>
      </div>
    </header>
  )
}
