"use client"

import { usePathname } from "next/navigation"
import type { Language } from "@/i18n/config"
import { LogoBrand } from "../logo"
import { LanguageSwitcher } from "../language-switcher"
import { ThemeToggle } from "../theme-toggle"
import { UserDropdown } from "../user-dropdown"
import Link from "next/link"
import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"

export default function Header({ language }: { language: Language }) {
  const pathname = usePathname()

  if (
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  ) {
    return null
  }

  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky flex items-center justify-between top-0 z-50 w-full transition-all duration-300 ease-in-out p-2 ${isSticky ? "bg-white/70 shadow-md backdrop-blur p-2 rounded-[18px] mt-2" : "bg-transparent"}`}
    >
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
    </header>
  )
}
