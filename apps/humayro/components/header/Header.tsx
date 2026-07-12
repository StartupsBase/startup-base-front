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
        will-change-[width]
        duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
        w-[calc(100%-60rem)] 
        transition-all
        ${
          isSticky
            ? "max-w-[1100px] rounded-4xl bg-primary/15 px-5 py-2 shadow-md backdrop-blur"
            : "w-full max-w-none rounded-none bg-transparent px-2 py-2 shadow-none"
        }
      `}
    >
      <div className="mx-auto flex w-full max-w-6xl justify-between">
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
