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
      className={`sticky top-2 z-50 mx-auto flex items-center justify-between border transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-none ${
        isSticky
          ? "w-[calc(100%-4rem)] max-w-[1380px] rounded-4xl bg-white/15 p-2 backdrop-blur dark:bg-primary/15"
          : "w-[calc(100%-2rem)] max-w-[1580px] rounded-none border-none bg-transparent p-2 shadow-none"
      } `}
    >
      <div className="flex w-full justify-between px-4">
        <LogoBrand />

        <div className="flex items-center gap-2">
          <Button className="flex h-[44px] items-center justify-center rounded-[12px]">
            <HugeiconsIcon icon={SearchList01Icon} className="size-5" />
            Katalog
          </Button>
          <AdvancedSearch language={language} />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher language={language} />
          <ThemeToggle />
          <StorefrontNavActions language={language} />
          <UserDropdown language={language} />
        </div>
      </div>
    </header>
  )
}
