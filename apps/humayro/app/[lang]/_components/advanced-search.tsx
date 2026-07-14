"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Input } from "@/components/input"
import type { Language } from "@/i18n/config"
import { useGetAll2 } from "@/lib/api/generated/product/product"
import type { ProductListDTO } from "@/lib/api/model/productListDTO"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { cn } from "@workspace/ui/lib/utils"

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

function getProductName(product: ProductListDTO, language: Language) {
  if (language === "ru") {
    return product.nameRu || product.name || product.nameEng || "—"
  }

  return product.name || product.nameRu || product.nameEng || "—"
}

function formatPrice(price: number | undefined, language: Language) {
  if (price == null) return null

  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ").format(price)} so'm`
}

export function AdvancedSearch({ language }: { language: Language }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const storefrontText = useStorefrontCopy()
  const text = {
    placeholder: storefrontText.searchPlaceholder,
    results: storefrontText.searchResults,
    hint: storefrontText.searchHint,
    empty: storefrontText.searchEmpty,
    error: storefrontText.searchError,
    close: storefrontText.searchClose,
    category: storefrontText.withoutCategory,
  }
  const debouncedQuery = useDebouncedValue(query.trim(), 250)

  const productsQuery = useGetAll2(
    {
      active: true,
      search: debouncedQuery || undefined,
      sort: "name,asc",
      page: 0,
      size: 8,
    },
    {
      query: {
        enabled: isOpen,
        staleTime: 30_000,
      },
    }
  )

  const products = productsQuery.data?.content ?? []

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

  function selectProduct(product: ProductListDTO) {
    setQuery(getProductName(product, language))
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false)
      return
    }

    if (!products.length) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % products.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + products.length) % products.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const product = products[activeIndex]
      if (product) selectProduct(product)
    }
  }

  const searchOverlay = isOpen ? (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <button
        type="button"
        aria-label={text.close}
        className="absolute inset-0 cursor-default bg-background/35 backdrop-blur-md"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative mx-auto mt-20 w-[min(640px,calc(100%-2rem))] animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-primary"
          />
          <Input
            ref={inputRef}
            value={query}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              products[activeIndex]?.id != null
                ? `${listboxId}-${products[activeIndex].id}`
                : undefined
            }
            placeholder={text.placeholder}
            className="h-14 rounded-2xl border-primary/30 bg-background pr-12 pl-12 text-base shadow-2xl focus-visible:border-primary"
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          {productsQuery.isFetching && (
            <span
              aria-label="Loading"
              className="absolute top-1/2 right-5 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
            />
          )}
        </div>

        <div
          id={listboxId}
          role="listbox"
          aria-label={text.results}
          className="mt-2 max-h-[min(520px,calc(100vh-170px))] overflow-y-auto rounded-2xl border border-border/70 bg-popover p-2 shadow-2xl"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold">{text.results}</p>
            <p className="text-xs text-muted-foreground">{text.hint}</p>
          </div>

          {productsQuery.isError ? (
            <SearchMessage>{text.error}</SearchMessage>
          ) : !productsQuery.isPending && products.length === 0 ? (
            <SearchMessage>{text.empty}</SearchMessage>
          ) : productsQuery.isPending ? (
            <div className="space-y-1 p-1" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[68px] animate-pulse rounded-xl bg-muted/70"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {products.map((product, index) => {
                const price = formatPrice(
                  product.discountedPrice ?? product.basePrice,
                  language
                )
                const name = getProductName(product, language)
                const isActive = index === activeIndex

                return (
                  <button
                    key={product.id ?? `${name}-${index}`}
                    id={
                      product.id != null
                        ? `${listboxId}-${product.id}`
                        : undefined
                    }
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted/70"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectProduct(product)}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                      {name.charAt(0).toLocaleUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {product.categoryName || text.category}
                        {product.organizationName
                          ? ` · ${product.organizationName}`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {price && (
                        <span className="block text-sm font-semibold">{price}</span>
                      )}
                      {product.ratingAvg != null && (
                        <span className="block text-xs text-muted-foreground">
                          ★ {product.ratingAvg.toFixed(1)}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
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
          aria-label={text.placeholder}
          placeholder={text.placeholder}
          className="cursor-text pr-4 pl-11"
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
        />
      </div>
      {typeof document !== "undefined" &&
        searchOverlay &&
        createPortal(searchOverlay, document.body)}
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
