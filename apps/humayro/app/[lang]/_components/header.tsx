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
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { LanguageSwitcher } from "@/components/language-switcher"
import { LogoBrand } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Language } from "@/i18n/config"
import { useGetAll4 } from "@/lib/api/generated/category/category"
import type { CategoryDTO } from "@/lib/api/model/categoryDTO"
import { useCatalogStore } from "@/lib/stores/use-catalog-store"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
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
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [activeParentId, setActiveParentId] = useState<number | null>(null)
  const catalogMenuRef = useRef<HTMLDivElement>(null)
  const setCategoryId = useCatalogStore((state) => state.setCategoryId)
  const isHeaderHidden =
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  const categoriesQuery = useGetAll4(
    { active: true },
    {
      query: {
        enabled: !isHeaderHidden,
        staleTime: 5 * 60_000,
      },
    }
  )
  const categories = [...(categoriesQuery.data ?? [])].sort(
    (first, second) =>
      (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
      getCategoryName(first, language).localeCompare(
        getCategoryName(second, language)
      )
  )
  const parentCategories = categories.filter(
    (category) => category.parentId == null && category.id != null
  )
  const selectedParentId =
    activeParentId != null &&
    parentCategories.some((category) => category.id === activeParentId)
      ? activeParentId
      : (parentCategories[0]?.id ?? null)
  const selectedParent = parentCategories.find(
    (category) => category.id === selectedParentId
  )
  const childCategories = categories.filter(
    (category) => category.parentId === selectedParentId
  )

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isCatalogOpen) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !catalogMenuRef.current?.contains(event.target)
      ) {
        setIsCatalogOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCatalogOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [isCatalogOpen])

  if (isHeaderHidden) {
    return null
  }

  const homeHref = `/${language}`
  const catalogHref = `/${language}/products`

  return (
    <>
      <header
        className={`sticky top-0 z-40 mx-auto flex w-full items-center border-b border-border/70 bg-background/10 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 lg:hidden ${
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
            <div ref={catalogMenuRef}>
              <Button
                type="button"
                aria-expanded={isCatalogOpen}
                aria-controls="desktop-catalog-menu"
                className="h-10 shrink-0 rounded-xl px-4 xl:h-11"
                onClick={() => setIsCatalogOpen((current) => !current)}
              >
                <HugeiconsIcon icon={SearchList01Icon} className="size-5" />
                <span>{t("productDetails.catalog")}</span>
              </Button>

              {isCatalogOpen ? (
                <DesktopCatalogMenu
                  language={language}
                  categories={categories}
                  parentCategories={parentCategories}
                  selectedParent={selectedParent}
                  selectedParentId={selectedParentId}
                  childCategories={childCategories}
                  isPending={categoriesQuery.isPending}
                  catalogHref={catalogHref}
                  onParentChange={setActiveParentId}
                  onCategorySelect={(categoryId) => {
                    setCategoryId(categoryId)
                    setIsCatalogOpen(false)
                  }}
                />
              ) : null}
            </div>
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

type DesktopCatalogMenuProps = {
  language: Language
  categories: CategoryDTO[]
  parentCategories: CategoryDTO[]
  selectedParent?: CategoryDTO
  selectedParentId: number | null
  childCategories: CategoryDTO[]
  isPending: boolean
  catalogHref: string
  onParentChange: (categoryId: number) => void
  onCategorySelect: (categoryId: number | null) => void
}

function DesktopCatalogMenu({
  language,
  categories,
  parentCategories,
  selectedParent,
  selectedParentId,
  childCategories,
  isPending,
  catalogHref,
  onParentChange,
  onCategorySelect,
}: DesktopCatalogMenuProps) {
  const copy =
    language === "uz"
      ? {
          allProducts: "Barcha mahsulotlar",
          loading: "Kategoriyalar yuklanmoqda...",
          empty: "Kategoriyalar topilmadi",
        }
      : {
          allProducts: "Все товары",
          loading: "Загружаем категории...",
          empty: "Категории не найдены",
        }

  return (
    <div
      id="desktop-catalog-menu"
      className="absolute top-[calc(100%+0.5rem)] left-1/2 z-60 flex max-h-[min(72svh,46rem)] w-[calc(100vw-4rem)] max-w-[1580px] -translate-x-1/2 overflow-hidden rounded-3xl border border-border/70 bg-background text-foreground shadow-[0_28px_80px_-28px_rgba(0,0,0,.55)]"
    >
      {isPending ? (
        <p className="w-full p-10 text-center text-sm text-muted-foreground">
          {copy.loading}
        </p>
      ) : parentCategories.length === 0 ? (
        <p className="w-full p-10 text-center text-sm text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <>
          <nav
            aria-label={copy.allProducts}
            className="w-72 shrink-0 overflow-y-auto border-r border-border/70 bg-muted/35 p-3"
          >
            <Link
              href={catalogHref}
              className="mb-2 flex min-h-12 items-center rounded-xl px-3 text-sm font-bold transition-colors hover:bg-primary/10 hover:text-primary"
              onClick={() => onCategorySelect(null)}
            >
              {copy.allProducts}
            </Link>

            {parentCategories.map((category) => {
              const categoryId = category.id
              if (categoryId == null) return null

              return (
                <button
                  key={categoryId}
                  type="button"
                  aria-current={
                    selectedParentId === categoryId ? "true" : undefined
                  }
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                    selectedParentId === categoryId
                      ? "bg-primary/12 text-primary"
                      : "hover:bg-muted"
                  )}
                  onMouseEnter={() => onParentChange(categoryId)}
                  onFocus={() => onParentChange(categoryId)}
                  onClick={() => onParentChange(categoryId)}
                >
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="size-8 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {getCategoryName(category, language)
                        .charAt(0)
                        .toLocaleUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {getCategoryName(category, language)}
                  </span>
                  <span aria-hidden="true" className="text-lg opacity-45">
                    ›
                  </span>
                </button>
              )
            })}
          </nav>

          <section className="min-w-0 flex-1 overflow-y-auto p-7">
            {selectedParent?.id != null ? (
              <Link
                href={catalogHref}
                className="inline-flex items-center gap-2 text-2xl font-bold tracking-[-0.025em] hover:text-primary"
                onClick={() => onCategorySelect(selectedParent.id!)}
              >
                {getCategoryName(selectedParent, language)}
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}

            {childCategories.length ? (
              <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-8 xl:grid-cols-3">
                {childCategories.map((child) => {
                  const childId = child.id
                  if (childId == null) return null
                  const grandchildren = categories.filter(
                    (category) => category.parentId === childId
                  )

                  return (
                    <div key={childId} className="min-w-0">
                      <Link
                        href={catalogHref}
                        className="flex items-center gap-2 font-bold hover:text-primary"
                        onClick={() => onCategorySelect(childId)}
                      >
                        {child.imageUrl ? (
                          <img
                            src={child.imageUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-xl object-cover"
                          />
                        ) : null}
                        <span>{getCategoryName(child, language)}</span>
                      </Link>

                      {grandchildren.length ? (
                        <div className="mt-3 space-y-2">
                          {grandchildren.map((grandchild) =>
                            grandchild.id == null ? null : (
                              <Link
                                key={grandchild.id}
                                href={catalogHref}
                                className="block truncate text-sm text-muted-foreground transition-colors hover:text-primary"
                                onClick={() => onCategorySelect(grandchild.id!)}
                              >
                                {getCategoryName(grandchild, language)}
                              </Link>
                            )
                          )}
                        </div>
                      ) : child.descriptionUz || child.descriptionRu ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {language === "ru"
                            ? child.descriptionRu || child.descriptionUz
                            : child.descriptionUz || child.descriptionRu}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : selectedParent ? (
              <p className="mt-6 text-sm text-muted-foreground">{copy.empty}</p>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}

function getCategoryName(category: CategoryDTO, language: Language) {
  return language === "ru"
    ? category.nameRu || category.name || category.nameEng || "—"
    : category.name || category.nameRu || category.nameEng || "—"
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
