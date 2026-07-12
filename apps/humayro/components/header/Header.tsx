"use client"

import { usePathname } from "next/navigation"

import type { Language } from "@/i18n/config"
import { LogoBrand } from "../logo"
import { LanguageSwitcher } from "../language-switcher"
import { ThemeToggle } from "../theme-toggle"
import { UserDropdown } from "../user-dropdown"
import Container from "../container"
import Link from "next/link"
import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export default function Header({ language }: { language: Language }) {
  const pathname = usePathname()

  if (
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  ) {
    return null
  }

  return (
    <header className={`flex w-full items-center justify-between`}>
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
