"use client"

import { useGetAll4 } from "@/lib/api/generated/category/category"
import { useGetAll3 } from "@/lib/api/generated/color/color"
import { useGetFavoriteIds } from "@/lib/api/generated/favorite/favorite"
import {
  getGetById2QueryOptions,
  useGetAll2,
} from "@/lib/api/generated/product/product"
import { useGetAll1 } from "@/lib/api/generated/size/size"
import type { CategoryDTO } from "@/lib/api/model/categoryDTO"
import type { ColorDTO } from "@/lib/api/model/colorDTO"
import type { SizeDTO } from "@/lib/api/model/sizeDTO"
import type { Language } from "@/i18n/config"
import { useHasAuthToken } from "@/lib/use-auth-token"
import {
  useCatalogStore,
  type CatalogSort,
} from "@/lib/stores/use-catalog-store"
import { Button } from "@workspace/ui/components/button"
import { Sheet, SheetContent, SheetTitle } from "@workspace/ui/components/sheet"
import { Slider } from "@workspace/ui/components/slider"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { useQueries } from "@tanstack/react-query"
import { useState } from "react"

import { ProductCard } from "./product-card"
import { useStorefrontActions } from "./use-storefront-actions"

const sortMap: Record<CatalogSort, string> = {
  newest: "id,desc",
  "price-low": "discountedPrice,asc",
  "price-high": "discountedPrice,desc",
}

const PRICE_MIN = 0
const PRICE_MAX = 10_000_000
const PRODUCTS_PAGE_SIZE = 24

type CatalogSectionProps = {
  language: Language
  mode?: "homepage" | "products"
  searchQuery?: string
}

export function CatalogSection({
  language,
  mode = "homepage",
  searchQuery = "",
}: CatalogSectionProps) {
  const text = useStorefrontCopy()
  const isProductsPage = mode === "products"
  const hasToken = useHasAuthToken()
  const categoryId = useCatalogStore((state) => state.categoryId)
  const sort = useCatalogStore((state) => state.sort)
  const setCategoryId = useCatalogStore((state) => state.setCategoryId)
  const setSort = useCatalogStore((state) => state.setSort)
  const actions = useStorefrontActions(language)
  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>([
    PRICE_MIN,
    PRICE_MAX,
  ])
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_MIN,
    PRICE_MAX,
  ])
  const [colorId, setColorId] = useState<number | null>(null)
  const [sizeId, setSizeId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const categoriesQuery = useGetAll4(
    { active: true },
    { query: { staleTime: 5 * 60_000 } }
  )
  const colorsQuery = useGetAll3({
    query: { staleTime: 5 * 60_000, retry: false },
  })
  const sizesQuery = useGetAll1(undefined, {
    query: { staleTime: 5 * 60_000, retry: false },
  })
  const productsQuery = useGetAll2(
    {
      active: true,
      categoryId: categoryId ?? undefined,
      minPrice: priceRange[0] > PRICE_MIN ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
      colorId: colorId ?? undefined,
      sizeId: sizeId ?? undefined,
      search: searchQuery || undefined,
      sort: sortMap[sort],
      page: isProductsPage ? page : 0,
      size: isProductsPage ? PRODUCTS_PAGE_SIZE : 12,
    },
    { query: { retry: 1 } }
  )
  const favoritesQuery = useGetFavoriteIds({
    query: { enabled: hasToken, retry: false },
  })

  const products = productsQuery.data?.content ?? []
  const totalElements = productsQuery.data?.totalElements ?? products.length
  const totalPages = Math.max(productsQuery.data?.totalPages ?? 1, 1)
  const filterProductQueries = useQueries({
    queries: products.flatMap((product) =>
      product.id == null
        ? []
        : [
            getGetById2QueryOptions(product.id, {
              query: { staleTime: 5 * 60_000, retry: 1 },
            }),
          ]
    ),
  })
  const categories = [...(categoriesQuery.data ?? [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      (a.name ?? "").localeCompare(b.name ?? "")
  )
  const parentCategories = categories.filter(
    (category) => category.parentId == null
  )
  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  )
  const activeParentId = selectedCategory?.parentId ?? selectedCategory?.id
  const childCategories = categories.filter(
    (category) => category.parentId === activeParentId
  )
  const favoriteIds = new Set(
    hasToken ? (favoritesQuery.data ?? []) : actions.guestFavoriteIds
  )
  const variantColors: ColorDTO[] = filterProductQueries.flatMap(
    (query) =>
      query.data?.variants?.flatMap((variant) =>
        variant.colorId == null
          ? []
          : [
              {
                id: variant.colorId,
                name: variant.colorName,
                hexCode: variant.colorHex,
              } satisfies ColorDTO,
            ]
      ) ?? []
  )
  const variantSizes: SizeDTO[] = filterProductQueries.flatMap(
    (query) =>
      query.data?.variants?.flatMap((variant) =>
        variant.sizeId == null
          ? []
          : [
              {
                id: variant.sizeId,
                value: variant.sizeValue,
              } satisfies SizeDTO,
            ]
      ) ?? []
  )
  const colors = Array.from(
    new Map(
      [...variantColors, ...(colorsQuery.data ?? [])]
        .filter((color) => color.id != null)
        .map((color) => [color.id, color])
    ).values()
  )
  const sizes = Array.from(
    new Map(
      [...variantSizes, ...(sizesQuery.data ?? [])]
        .filter((size) => size.id != null)
        .map((size) => [size.id, size])
    ).values()
  ).sort(
    (first, second) =>
      (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
      (first.value ?? "").localeCompare(second.value ?? "")
  )
  const sortLabels: Record<CatalogSort, string> = {
    newest: text.newest,
    "price-low": text.priceLow,
    "price-high": text.priceHigh,
  }
  const resultSummary = (
    searchQuery ? text.productsFoundFor : text.productsFound
  )
    .replace("{{query}}", searchQuery)
    .replace(
      "{{count}}",
      totalElements.toLocaleString(language === "ru" ? "ru-RU" : "uz-UZ")
    )

  function applyPriceRange(range: number[]) {
    const nextRange: [number, number] = [
      Math.max(PRICE_MIN, Math.min(range[0] ?? PRICE_MIN, PRICE_MAX)),
      Math.max(PRICE_MIN, Math.min(range[1] ?? PRICE_MAX, PRICE_MAX)),
    ]
    nextRange.sort((first, second) => first - second)
    setDraftPriceRange(nextRange)
    setPriceRange(nextRange)
    setPage(0)
  }

  function resetFilters() {
    const initialRange: [number, number] = [PRICE_MIN, PRICE_MAX]
    setDraftPriceRange(initialRange)
    setPriceRange(initialRange)
    setColorId(null)
    setSizeId(null)
    if (selectedCategory?.parentId != null) {
      setCategoryId(selectedCategory.parentId)
    }
    setPage(0)
  }

  function selectCategory(id: number | null) {
    setCategoryId(id)
    setPage(0)
  }

  function toggleColor(id: number) {
    setColorId((current) => (current === id ? null : id))
    setPage(0)
  }

  function toggleSize(id: number) {
    setSizeId((current) => (current === id ? null : id))
    setPage(0)
  }

  return (
    <section
      id="catalog"
      className={cn(
        "scroll-mt-24 px-4 sm:px-6",
        isProductsPage ? "py-8 sm:py-12 lg:py-16" : "py-20 lg:py-28"
      )}
    >
      <div
        className={cn(
          "mx-auto",
          isProductsPage ? "max-w-[96rem]" : "max-w-7xl"
        )}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-[0.2em] text-primary capitalize">
              {isProductsPage ? text.productsEyebrow : text.catalogEyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {isProductsPage ? text.productsTitle : text.catalogTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {isProductsPage ? resultSummary : text.catalogDescription}
            </p>
          </div>

          <div className="flex w-full items-center gap-2 lg:w-auto">
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as CatalogSort)
                setPage(0)
              }}
            >
              <SelectTrigger className="h-11 min-w-0 flex-1 rounded-2xl bg-background sm:min-w-48 lg:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {(Object.keys(sortLabels) as CatalogSort[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {sortLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              className="flex h-11 shrink-0 rounded-2xl lg:hidden"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen(true)}
            >
              {text.filters}
            </Button>
          </div>
        </div>

        <div className="mt-9 hidden justify-end border-b pb-4 lg:flex">
          <Button
            type="button"
            variant={desktopFiltersOpen ? "default" : "outline"}
            className="h-11 shrink-0 rounded-full px-5"
            aria-expanded={desktopFiltersOpen}
            onClick={() => setDesktopFiltersOpen((current) => !current)}
          >
            {text.filters}
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-[96rem]">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent
            side="right"
            className="w-screen! max-w-none! overflow-y-auto px-4 pt-14 pb-8 sm:max-w-none! lg:hidden"
          >
            <SheetTitle className="sr-only">{text.mobileFilters}</SheetTitle>
            <CatalogFilters
              language={language}
              parentCategories={parentCategories}
              categories={childCategories}
              colors={colors}
              sizes={sizes}
              draftPriceRange={draftPriceRange}
              appliedPriceRange={priceRange}
              selectedCategoryId={categoryId}
              selectedColorId={colorId}
              selectedSizeId={sizeId}
              optionsLoading={
                colorsQuery.isPending ||
                sizesQuery.isPending ||
                filterProductQueries.some((query) => query.isPending)
              }
              onDraftPriceChange={setDraftPriceRange}
              onApplyPriceRange={applyPriceRange}
              onCategoryChange={selectCategory}
              onColorChange={toggleColor}
              onSizeChange={toggleSize}
              onReset={resetFilters}
              className="mt-0 border-0 bg-transparent p-0 shadow-none"
            />
          </SheetContent>
        </Sheet>

        <div className="flex justify-center gap-10">
          {desktopFiltersOpen ? (
            <div className="hidden lg:sticky lg:top-24 lg:block lg:min-w-52.5 lg:self-start xl:min-w-62.5">
              <CatalogFilters
                language={language}
                parentCategories={parentCategories}
                categories={childCategories}
                colors={colors}
                sizes={sizes}
                draftPriceRange={draftPriceRange}
                appliedPriceRange={priceRange}
                selectedCategoryId={categoryId}
                selectedColorId={colorId}
                selectedSizeId={sizeId}
                optionsLoading={
                  colorsQuery.isPending ||
                  sizesQuery.isPending ||
                  filterProductQueries.some((query) => query.isPending)
                }
                onDraftPriceChange={setDraftPriceRange}
                onApplyPriceRange={applyPriceRange}
                onCategoryChange={selectCategory}
                onColorChange={toggleColor}
                onSizeChange={toggleSize}
                onReset={resetFilters}
              />
            </div>
          ) : null}

          <div
            className={cn(
              "w-full min-w-0 flex-1",
              isProductsPage
                ? "max-w-none"
                : "max-w-312 xl:max-w-261 2xl:max-w-312"
            )}
          >
            {productsQuery.isPending ? (
              <div
                className={cn(
                  "mt-10 gap-4 pb-2",
                  isProductsPage
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                    : "flex snap-x snap-mandatory overflow-x-auto overscroll-x-auto"
                )}
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "overflow-hidden rounded-2xl border",
                      !isProductsPage &&
                        "w-[86%] max-w-80 shrink-0 snap-start sm:w-72 sm:max-w-none lg:w-75"
                    )}
                  >
                    <div className="aspect-4/3 animate-pulse bg-muted" />
                    <div className="space-y-3 p-3">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-8 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productsQuery.isError ? (
              <div className="mt-10 rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center">
                <p className="text-destructive">{text.productsError}</p>
                <Button
                  className="mt-4"
                  onClick={() => productsQuery.refetch()}
                >
                  {text.retry}
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed p-16 text-center text-muted-foreground">
                {text.noProducts}
              </div>
            ) : (
              <div
                className={cn(
                  "mt-10 gap-4 pb-2",
                  isProductsPage
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                    : "scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
                )}
              >
                {products.map((product, index) => (
                  <div
                    key={product.id ?? index}
                    className={cn(
                      "min-w-0",
                      !isProductsPage &&
                        "w-[86%] max-w-80 shrink-0 snap-start sm:w-72 sm:max-w-none lg:w-75"
                    )}
                  >
                    <ProductCard
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
                  </div>
                ))}
              </div>
            )}
            {isProductsPage && totalPages > 1 ? (
              <nav
                aria-label={text.paginationPage
                  .replace("{{current}}", String(page + 1))
                  .replace("{{total}}", String(totalPages))}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 0 || productsQuery.isFetching}
                  onClick={() => {
                    setPage((current) => Math.max(0, current - 1))
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  {text.previousPage}
                </Button>
                <span className="min-w-32 text-center text-sm font-semibold text-muted-foreground">
                  {text.paginationPage
                    .replace("{{current}}", String(page + 1))
                    .replace("{{total}}", String(totalPages))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page + 1 >= totalPages || productsQuery.isFetching}
                  onClick={() => {
                    setPage((current) => Math.min(totalPages - 1, current + 1))
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  {text.nextPage}
                </Button>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

type CatalogFiltersProps = {
  language: Language
  parentCategories?: CategoryDTO[]
  categories: CategoryDTO[]
  colors: ColorDTO[]
  sizes: SizeDTO[]
  draftPriceRange: [number, number]
  appliedPriceRange: [number, number]
  selectedCategoryId: number | null
  selectedColorId: number | null
  selectedSizeId: number | null
  optionsLoading: boolean
  onDraftPriceChange: (range: [number, number]) => void
  onApplyPriceRange: (range: number[]) => void
  onCategoryChange: (id: number | null) => void
  onColorChange: (id: number) => void
  onSizeChange: (id: number) => void
  onReset: () => void
  className?: string
}

function CatalogFilters({
  language,
  parentCategories = [],
  categories,
  colors,
  sizes,
  draftPriceRange,
  appliedPriceRange,
  selectedCategoryId,
  selectedColorId,
  selectedSizeId,
  optionsLoading,
  onDraftPriceChange,
  onApplyPriceRange,
  onCategoryChange,
  onColorChange,
  onSizeChange,
  onReset,
  className,
}: CatalogFiltersProps) {
  const text = useStorefrontCopy()
  const selectedCategory = [...parentCategories, ...categories].find(
    (category) => category.id === selectedCategoryId
  )
  const selectedParentId =
    selectedCategory?.parentId ?? selectedCategory?.id ?? null
  const isFiltered =
    categories.some((category) => category.id === selectedCategoryId) ||
    appliedPriceRange[0] !== PRICE_MIN ||
    appliedPriceRange[1] !== PRICE_MAX ||
    selectedColorId != null ||
    selectedSizeId != null

  function updatePrice(index: 0 | 1, value: number) {
    const clamped = Math.max(PRICE_MIN, Math.min(value || 0, PRICE_MAX))
    const nextRange: [number, number] = [...draftPriceRange]
    nextRange[index] =
      index === 0
        ? Math.min(clamped, nextRange[1])
        : Math.max(clamped, nextRange[0])
    onDraftPriceChange(nextRange)
  }

  return (
    <aside
      className={cn(
        "mt-10 rounded-2xl border bg-card/60 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-commerce text-lg font-bold">{text.filters}</h3>
        {isFiltered ? (
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={onReset}
          >
            {text.clearFilters}
          </button>
        ) : null}
      </div>

      {parentCategories.length ? (
        <fieldset className="mt-6 border-t pt-5">
          <legend className="text-sm font-semibold">
            {text.mobileFilters}
          </legend>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              aria-pressed={selectedCategoryId == null}
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                selectedCategoryId == null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => onCategoryChange(null)}
            >
              {text.allCategories}
            </button>
            {parentCategories.map((category) => {
              if (category.id == null) return null
              const name =
                language === "ru"
                  ? category.nameRu || category.name || category.nameEng
                  : category.name || category.nameRu || category.nameEng

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selectedParentId === category.id}
                  className={cn(
                    "flex min-h-16 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                    selectedParentId === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => onCategoryChange(category.id!)}
                >
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <span className="min-w-0 break-words">{name || "—"}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : null}

      {categories.length ? (
        <fieldset className="mt-6 border-t pt-5">
          <legend className="text-sm font-semibold">
            {text.subcategories}
          </legend>
          <div className="mt-3 flex flex-col gap-2">
            {categories.map((category) => {
              if (category.id == null) return null
              const name =
                language === "ru"
                  ? category.nameRu || category.name || category.nameEng
                  : category.name || category.nameRu || category.nameEng

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selectedCategoryId === category.id}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                    selectedCategoryId === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => onCategoryChange(category.id!)}
                >
                  {name || "—"}
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">{text.priceRange}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="min-w-0">
            <span className="sr-only">{text.priceFrom}</span>
            <input
              type="text"
              inputMode="numeric"
              value={draftPriceRange[0].toLocaleString("ru-RU")}
              aria-label={text.priceFrom}
              className="h-10 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              onChange={(event) => {
                const rawValue = event.target.value.replace(/\D/g, "")
                const value = rawValue ? Number(rawValue) : 0

                updatePrice(
                  0,
                  Math.max(PRICE_MIN, Math.min(value, draftPriceRange[1]))
                )
              }}
              onBlur={() => onApplyPriceRange(draftPriceRange)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onApplyPriceRange(draftPriceRange)
                  event.currentTarget.blur()
                }
              }}
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">{text.priceTo}</span>
            <input
              type="text"
              inputMode="numeric"
              value={draftPriceRange[1].toLocaleString("ru-RU")}
              aria-label={text.priceTo}
              className="h-10 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              onChange={(event) => {
                const rawValue = event.target.value.replace(/\D/g, "")
                const value = Number(rawValue)

                updatePrice(1, Math.min(value, PRICE_MAX))
              }}
              onBlur={() => onApplyPriceRange(draftPriceRange)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onApplyPriceRange(draftPriceRange)
                  event.currentTarget.blur()
                }
              }}
            />
          </label>
        </div>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={10_000}
          value={draftPriceRange}
          aria-label={text.priceRange}
          className="mt-4 py-2 [&_[data-slot=slider-track]]:h-1.5"
          onValueChange={(value) =>
            onDraftPriceChange(value as [number, number])
          }
          onValueCommit={onApplyPriceRange}
        />
      </fieldset>

      <fieldset className="mt-6 border-t pt-5">
        <legend className="text-sm font-semibold">{text.colors}</legend>
        {colors.length ? (
          <>
            <div className="mt-3 space-y-1">
              {colors.map((color) => {
                if (color.id == null) return null
                const name = getCatalogColorName(color, language, text)

                return (
                  <button
                    key={color.id}
                    type="button"
                    aria-pressed={selectedColorId === color.id}
                    className={cn(
                      "flex min-h-9 w-full items-center gap-3 rounded-xl px-2 text-left text-sm transition",
                      selectedColorId === color.id
                        ? "bg-primary/12 font-semibold text-primary ring-1 ring-primary/25"
                        : "hover:bg-muted"
                    )}
                    onClick={() => onColorChange(color.id!)}
                  >
                    <span
                      aria-hidden="true"
                      className="size-5 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: getColorHex(color.hexCode) }}
                    />
                    <span className="truncate">
                      {name || text.unnamedColor}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {optionsLoading ? text.loadingOptions : text.noOptions}
          </p>
        )}
      </fieldset>

      <fieldset className="mt-6 border-t pt-5">
        <legend className="text-sm font-semibold">{text.sizes}</legend>
        {sizes.length ? (
          <>
            <div className="mt-3 space-y-1">
              {sizes.map((size) =>
                size.id == null ? null : (
                  <div
                    key={size.id}
                    className={cn(
                      "flex min-h-9 items-center gap-3 px-1 text-sm",
                      selectedSizeId === size.id && "font-semibold text-primary"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSizeId === size.id}
                      aria-label={size.value || "—"}
                      className="size-4 shrink-0 cursor-pointer accent-primary"
                      onChange={() => onSizeChange(size.id!)}
                    />
                    <span>{size.value || "—"}</span>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {optionsLoading ? text.loadingOptions : text.noOptions}
          </p>
        )}
      </fieldset>
    </aside>
  )
}

function getColorHex(hexCode?: string) {
  if (!hexCode) return "var(--muted)"
  const normalized = hexCode.startsWith("#") ? hexCode : `#${hexCode}`
  return /^#[\da-f]{3,8}$/i.test(normalized) ? normalized : "var(--muted)"
}

type CatalogColorCopy = Pick<
  ReturnType<typeof useStorefrontCopy>,
  | "colorRed"
  | "colorGreen"
  | "colorBlue"
  | "colorBlack"
  | "colorWhite"
  | "colorYellow"
  | "colorBrown"
  | "colorGray"
  | "colorPink"
  | "colorPurple"
  | "colorKhaki"
>

function getCatalogColorName(
  color: ColorDTO,
  language: Language,
  text: CatalogColorCopy
) {
  if (language === "ru" && color.nameRu) return color.nameRu
  if (language === "uz" && color.nameUz) return color.nameUz

  const fallbackName =
    color.name || color.nameUz || color.nameRu || color.nameEng || ""
  const normalizedName = fallbackName
    .toLocaleLowerCase()
    .replaceAll("‘", "'")
    .replaceAll("’", "'")

  const knownColorKeys: Record<string, keyof CatalogColorCopy> = {
    qizil: "colorRed",
    red: "colorRed",
    красный: "colorRed",
    yashil: "colorGreen",
    green: "colorGreen",
    зелёный: "colorGreen",
    kok: "colorBlue",
    "ko'k": "colorBlue",
    blue: "colorBlue",
    синий: "colorBlue",
    qora: "colorBlack",
    black: "colorBlack",
    чёрный: "colorBlack",
    oq: "colorWhite",
    white: "colorWhite",
    белый: "colorWhite",
    sariq: "colorYellow",
    yellow: "colorYellow",
    жёлтый: "colorYellow",
    jigarrang: "colorBrown",
    brown: "colorBrown",
    коричневый: "colorBrown",
    kulrang: "colorGray",
    gray: "colorGray",
    grey: "colorGray",
    серый: "colorGray",
    pushti: "colorPink",
    pink: "colorPink",
    розовый: "colorPink",
    binafsha: "colorPurple",
    binafsharang: "colorPurple",
    purple: "colorPurple",
    фиолетовый: "colorPurple",
    xaki: "colorKhaki",
    khaki: "colorKhaki",
    хаки: "colorKhaki",
  }

  const colorKey = knownColorKeys[normalizedName]

  return colorKey ? text[colorKey] : fallbackName
}
