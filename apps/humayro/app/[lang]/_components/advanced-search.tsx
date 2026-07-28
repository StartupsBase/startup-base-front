"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

import { Input } from "@/components/input"
import type { Language } from "@/i18n/config"
import { useGetFavoriteIds } from "@/lib/api/generated/favorite/favorite"
import { useGetAll2 } from "@/lib/api/generated/product/product"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"

import { ProductCard } from "./storefront/product-card"
import { useStorefrontActions } from "./storefront/use-storefront-actions"

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function AdvancedSearch({ language }: { language: Language }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsId = useId()
  const router = useRouter()
  const text = useStorefrontCopy()
  const hasToken = useHasAuthToken()
  const actions = useStorefrontActions(language)
  const debouncedQuery = useDebouncedValue(query.trim(), 250)
  const productsQuery = useGetAll2(
    {
      active: true,
      search: debouncedQuery || undefined,
      sort: "name,asc",
      page: 0,
      size: 8,
    },
    { query: { enabled: isOpen, staleTime: 30_000 } }
  )
  const favoritesQuery = useGetFavoriteIds({
    query: { enabled: hasToken && isOpen, retry: false },
  })
  const products = productsQuery.data?.content ?? []
  const favoriteIds = new Set(
    hasToken ? (favoritesQuery.data ?? []) : actions.guestFavoriteIds
  )

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function openProductsPage() {
    const search = query.trim()
    const searchParams = new URLSearchParams()
    if (search) searchParams.set("search", search)

    setIsOpen(false)
    router.push(
      `/${language}/products${searchParams.size ? `?${searchParams}` : ""}`
    )
  }

  const searchOverlay = isOpen ? (
    <div className="fixed inset-0 z-100" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={text.searchClose}
        className="absolute inset-0 cursor-default bg-background/35 backdrop-blur-md"
        onClick={() => setIsOpen(false)}
      />
      <div className="xs:mt-3 xs:w-[calc(100%-1rem)] 2xs:mt-4 2xs:w-[calc(100%-1.5rem)] 3xl:max-w-[1440px] relative mx-auto mt-2 w-[calc(100%-0.75rem)] animate-in duration-200 fade-in-0 slide-in-from-top-2 sm:mt-6 sm:w-[calc(100%-2rem)] md:mt-8 md:max-w-[720px] lg:mt-10 lg:max-w-[960px] xl:max-w-[1120px] 2xl:max-w-[1280px]">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="xs:left-3.5 xs:size-4.5 pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-primary sm:left-4 sm:size-5 2xl:left-5 2xl:size-6"
          />
          <Input
            ref={inputRef}
            value={query}
            role="searchbox"
            aria-controls={resultsId}
            placeholder={text.searchPlaceholder}
            className="xs:h-12 xs:pr-10 xs:pl-10 xs:text-sm 2xs:rounded-2xl 3xl:h-16 3xl:text-xl h-11 rounded-xl border-primary/30 bg-background pr-9 pl-9 text-xs shadow-2xl focus-visible:border-primary sm:h-14 sm:pr-12 sm:pl-12 sm:text-base md:h-14 lg:h-14 xl:h-15 2xl:h-16 2xl:text-lg"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false)
              if (event.key === "Enter") {
                event.preventDefault()
                openProductsPage()
              }
            }}
          />
          {productsQuery.isFetching ? (
            <span className="xs:right-4 xs:size-4 absolute top-1/2 right-3 size-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/25 border-t-primary 2xl:right-5 2xl:size-5" />
          ) : null}
        </div>

        <section
          id={resultsId}
          aria-label={text.searchResults}
          className="xs:mt-2 xs:max-h-[calc(100vh-82px)] xs:p-2.5 2xs:rounded-2xl 3xl:p-6 mt-1.5 max-h-[calc(100vh-70px)] overflow-y-auto rounded-xl border border-border/70 bg-popover p-2 shadow-2xl sm:max-h-[calc(100vh-110px)] sm:p-3 md:max-h-[calc(100vh-125px)] lg:max-h-[calc(100vh-130px)] xl:p-4 2xl:p-5"
        >
          <div className="xs:mb-2.5 mb-2 flex items-center justify-between gap-2 px-1 sm:mb-3 xl:mb-4 2xl:mb-5">
            <p className="xs:text-sm 3xl:text-lg text-xs font-semibold 2xl:text-base">
              {text.searchResults}
            </p>
            <p className="xs:text-[11px] 3xl:text-base truncate text-[10px] text-muted-foreground sm:text-xs 2xl:text-sm">
              {text.searchHint}
            </p>
          </div>

          {productsQuery.isError ? (
            <SearchMessage>{text.searchError}</SearchMessage>
          ) : !productsQuery.isPending && products.length === 0 ? (
            <SearchMessage>{text.searchEmpty}</SearchMessage>
          ) : productsQuery.isPending ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-4/3 animate-pulse rounded-xl bg-muted/70"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id ?? index}
                  compact
                  product={product}
                  language={language}
                  isFavorite={product.id != null && favoriteIds.has(product.id)}
                  isAdding={actions.pendingCartId === product.id}
                  isTogglingFavorite={actions.pendingFavoriteId === product.id}
                  onAddToCart={actions.addProductToCart}
                  onToggleFavorite={actions.toggleFavorite}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="relative min-w-0 flex-1 lg:max-w-none">
        <HugeiconsIcon
          icon={Search01Icon}
          className="xs:left-3.5 xs:size-4.5 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:size-5 2xl:left-5 2xl:size-5.5"
        />
        <Input
          value={query}
          readOnly
          aria-label={text.searchPlaceholder}
          placeholder={text.searchPlaceholder}
          className="xs:h-10 xs:rounded-[10px] xs:pr-3.5 xs:pl-10 xs:text-xs 2xs:text-sm 3xl:text-lg h-9 cursor-text rounded-lg pr-3 pl-9 text-[11px] sm:h-11 sm:rounded-xl sm:pr-4 sm:pl-11 lg:h-10 lg:text-xs xl:h-11 xl:text-sm 2xl:h-12 2xl:pr-5 2xl:pl-13 2xl:text-base"
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
        />
      </div>
      {typeof document !== "undefined" && searchOverlay
        ? createPortal(searchOverlay, document.body)
        : null}
    </>
  )
}

function SearchMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-28 items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
