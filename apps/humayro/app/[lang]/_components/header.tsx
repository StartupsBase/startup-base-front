"use client"

import {
  HeartIcon,
  Home01Icon,
  SearchList01Icon,
  ShoppingCart02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { LanguageSwitcher } from "@/components/language-switcher"
import { LogoBrand } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Language } from "@/i18n/config"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

import { AdvancedSearch } from "./advanced-search"
import { StorefrontNavActions } from "./storefront/storefront-nav-actions"
import { UserDropdown } from "./user-dropdown"

export default function Header({ language }: { language: Language }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isSticky, setIsSticky] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  ) {
    return null
  }

  const homeHref = `/${language}`
  const catalogHref = `${homeHref}#catalog`

  return (
    <>
      <header
        className={`sticky top-0 z-40 mx-auto flex w-full items-center border-b border-border/70 bg-background/80 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          isSticky ? "shadow-[0_12px_30px_-24px_rgba(0,0,0,.8)]" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4">
          <LogoBrand className="shrink-0" />
          <div className="ml-auto hidden max-w-md min-w-0 flex-1 sm:block">
            <AdvancedSearch language={language} />
          </div>
        </div>
      </header>

      <header
        className={`sticky top-2 z-50 mx-auto hidden items-center justify-between border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex dark:border-none ${
          isSticky
            ? "w-[calc(100%-4rem)] max-w-345 rounded-4xl bg-white/15 p-2 backdrop-blur dark:bg-primary/15"
            : "w-[calc(100%-2rem)] max-w-[1580px] rounded-none border-none bg-transparent p-2 shadow-none"
        }`}
      >
        <div className="flex w-full items-center justify-between gap-4 px-4">
          <LogoBrand />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button asChild className="h-10 shrink-0 rounded-xl px-4 xl:h-11">
              <Link href={catalogHref}>
                <HugeiconsIcon icon={SearchList01Icon} className="size-5" />
                <span>{t("productDetails.catalog")}</span>
              </Link>
            </Button>
            <AdvancedSearch language={language} />
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <LanguageSwitcher language={language} />
            <ThemeToggle />
            <StorefrontNavActions language={language} />
            <UserDropdown language={language} />
          </div>
        </div>
      </header>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <nav
          data-mobile-storefront-nav
          aria-label={t("dashboard.navigation")}
          className="fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="mx-auto grid h-16 w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center rounded-[1.4rem] border border-border/70 bg-background/92 px-2 shadow-[0_-16px_44px_-28px_rgba(0,0,0,.85)] backdrop-blur-xl">
            <div className="justify-self-start">
              <StorefrontNavActions language={language} compact />
            </div>

            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("productDetails.catalog")}
                className="-mt-5 grid size-14 cursor-pointer place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[0_12px_28px_-12px_var(--primary)] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
              >
                <HugeiconsIcon
                  icon={SearchList01Icon}
                  strokeWidth={2}
                  className="size-6"
                />
              </button>
            </SheetTrigger>

            <div className="flex items-center gap-1 justify-self-end">
              <LanguageSwitcher language={language} className="size-11" />
              <UserDropdown language={language} compact />
            </div>
          </div>
        </nav>

        <SheetContent
          side="bottom"
          className="max-h-[88svh] overflow-y-auto rounded-t-[2rem] border-border/70 px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:hidden"
        >
          <div
            aria-hidden="true"
            className="mx-auto mt-1 h-1.5 w-12 rounded-full bg-muted-foreground/25"
          />
          <SheetHeader className="px-0 pt-5 pb-4">
            <SheetTitle className="pr-12 text-xl font-bold">
              {t("productDetails.catalog")}
            </SheetTitle>
            <SheetDescription className="max-w-xl leading-6">
              {t("storefront.catalogDescription")}
            </SheetDescription>
          </SheetHeader>

          <AdvancedSearch language={language} />

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <MobileMenuLink
              href={homeHref}
              label={t("productDetails.home")}
              icon={Home01Icon}
            />
            <MobileMenuLink
              href={catalogHref}
              label={t("productDetails.catalog")}
              icon={SearchList01Icon}
            />
            <MobileMenuLink
              href={`/${language}/favourites`}
              label={t("storefront.favoritesNav")}
              icon={HeartIcon}
            />
            <MobileMenuLink
              href={`/${language}/cart`}
              label={t("storefront.cartNav")}
              icon={ShoppingCart02Icon}
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-muted/60 p-3">
            <p className="text-sm font-semibold">{t("home.account")}</p>
            <div className="flex items-center gap-2">
              <LanguageSwitcher language={language} className="size-11" />
              <ThemeToggle className="size-11" />
              <UserDropdown language={language} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MobileMenuLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: typeof Home01Icon
  label: string
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className="flex min-h-24 flex-col items-start justify-between rounded-2xl border border-border/70 bg-background p-3.5 font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <HugeiconsIcon icon={icon} className="size-5 text-primary" />
        <span className="text-sm">{label}</span>
      </Link>
    </SheetClose>
  )
}
