"use client"

import { usePathname } from "next/navigation"
import type { Language } from "@/i18n/config"
import Link from "next/link"
import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { LogoBrand } from "@/components/logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "./user-dropdown"

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
      className={`
        sticky top-2 z-50 mx-auto flex items-center justify-between
        duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
        w-[calc(100%-80rem)] 
        transition-all
        border dark:border-none
        ${
          isSticky
            ? "min-w-[1380px] rounded-4xl bg-white/15 p-2 backdrop-blur dark:bg-primary/15"
            : "w-full max-w-none rounded-none border border-none bg-transparent p-2 shadow-none dark:border-none"
        }
      `}
    >
      <div className="flex w-full max-w-[1580px] mx-auto justify-between px-4">
      <LogoBrand />

      <div className="flex items-center gap-2">
        <LanguageSwitcher language={language} />
        <ThemeToggle />
        <Link href={"/favourites"} className="p-1">
          <HugeiconsIcon icon={HeartIcon} className="size-5" />
        </Link>
        <Link href={"/cart"} className="p-1">
          <HugeiconsIcon icon={ShoppingCart02Icon} className="size-5" />
        </Link>
        <UserDropdown language={language} />
      </div>
      </div>
    </header>
  )
}
