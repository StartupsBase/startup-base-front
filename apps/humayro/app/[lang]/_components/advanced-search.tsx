"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"

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

  const searchOverlay = isOpen ? (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={text.searchClose}
        className="absolute inset-0 cursor-default bg-background/35 backdrop-blur-md"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative mx-auto mt-10 w-[min(960px,calc(100%-2rem))] animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-primary"
          />
          <Input
            ref={inputRef}
            value={query}
            role="searchbox"
            aria-controls={resultsId}
            placeholder={text.searchPlaceholder}
            className="h-14 rounded-2xl border-primary/30 bg-background pr-12 pl-12 text-base shadow-2xl focus-visible:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false)
            }}
          />
          {productsQuery.isFetching ? (
            <span className="absolute top-1/2 right-5 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          ) : null}
        </div>

        <section
          id={resultsId}
          aria-label={text.searchResults}
          className="mt-2 max-h-[calc(100vh-130px)] overflow-y-auto rounded-2xl border border-border/70 bg-popover p-3 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-semibold">{text.searchResults}</p>
            <p className="text-xs text-muted-foreground">{text.searchHint}</p>
          </div>

          {productsQuery.isError ? (
            <SearchMessage>{text.searchError}</SearchMessage>
          ) : !productsQuery.isPending && products.length === 0 ? (
            <SearchMessage>{text.searchEmpty}</SearchMessage>
          ) : productsQuery.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/70"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id ?? index}
                  product={product}
                  language={language}
                  isFavorite={
                    product.id != null && favoriteIds.has(product.id)
                  }
                  isAdding={actions.pendingCartId === product.id}
                  isTogglingFavorite={
                    actions.pendingFavoriteId === product.id
                  }
                  onAddToCart={actions.addProductToCart}
                  onToggleFavorite={actions.toggleFavorite}
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
      <div className="relative w-[450px] max-w-[32vw]">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          readOnly
          aria-label={text.searchPlaceholder}
          placeholder={text.searchPlaceholder}
          className="cursor-text pr-4 pl-11"
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
