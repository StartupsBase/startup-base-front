"use client"

import { useGetAll5 } from "@/lib/api/generated/category/category"
import { useGetAll4 as useGetAllColors } from "@/lib/api/generated/color/color"
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
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  useCatalogStore,
  type CatalogSort,
} from "@/lib/stores/use-catalog-store"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Slider } from "@workspace/ui/components/slider"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { useQueries } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
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
  const [page, setPage] = useState(FIRST_PAGE)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const categoriesQuery = useGetAll5(
    { active: true },
    { query: { staleTime: 5 * 60_000 } }
  )
  const colorsQuery = useGetAllColors({
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
      page: toApiPage(isProductsPage ? page : FIRST_PAGE),
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
    setPage(FIRST_PAGE)
  }

  function resetFilters() {
    const initialRange: [number, number] = [PRICE_MIN, PRICE_MAX]
    setDraftPriceRange(initialRange)
    setPriceRange(initialRange)
    setColorId(null)
    setSizeId(null)
    setCategoryId(null)
    setPage(FIRST_PAGE)
  }

  function selectCategory(id: number | null) {
    setCategoryId(id)
    setPage(FIRST_PAGE)
  }

  function toggleColor(id: number) {
    setColorId((current) => (current === id ? null : id))
    setPage(FIRST_PAGE)
  }

  function toggleSize(id: number) {
    setSizeId((current) => (current === id ? null : id))
    setPage(FIRST_PAGE)
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
              noOptions={t("select.noSortingOptions")}
              value={sort}
              onValueChange={(value) => {
                setSort(value as CatalogSort)
                setPage(FIRST_PAGE)
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
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen(true)}
            >
              {text.filters}
            </Button>
          </div>
        </div>

        <div className="mt-9 hidden justify-end border-b pb-4 lg:flex">
          <Button
            type="button"
            variant={filtersOpen ? "default" : "outline"}
            className="h-11 shrink-0 rounded-full px-5"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(true)}
          >
            {text.filters}
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-[96rem]">
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent
            showCloseButton={false}
            className="h-[min(92dvh,800px)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden rounded-[2rem] border border-border/60 bg-background p-0 shadow-2xl sm:max-w-xl"
          >
            <DialogTitle className="sr-only">{text.mobileFilters}</DialogTitle>
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
              onClose={() => setFiltersOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <div className="flex justify-center">
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
                  .replace("{{current}}", String(page))
                  .replace("{{total}}", String(totalPages))}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === FIRST_PAGE || productsQuery.isFetching}
                  onClick={() => {
                    setPage((current) =>
                      Math.max(FIRST_PAGE, current - 1)
                    )
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  {text.previousPage}
                </Button>
                <span className="min-w-32 text-center text-sm font-semibold text-muted-foreground">
                  {text.paginationPage
                    .replace("{{current}}", String(page))
                    .replace("{{total}}", String(totalPages))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages || productsQuery.isFetching}
                  onClick={() => {
                    setPage((current) => Math.min(totalPages, current + 1))
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
  onClose: () => void
}

type FilterView = "overview" | "categories" | "colors" | "sizes"

const filterViewVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 72 : -72,
    opacity: 0,
    filter: "blur(8px)",
  }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (direction: number) => ({
    x: direction > 0 ? -72 : 72,
    opacity: 0,
    filter: "blur(8px)",
  }),
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
  onClose,
}: CatalogFiltersProps) {
  const text = useStorefrontCopy()
  const [view, setView] = useState<FilterView>("overview")
  const [direction, setDirection] = useState(1)
  const [categorySearch, setCategorySearch] = useState("")
  const selectedCategory = [...parentCategories, ...categories].find(
    (category) => category.id === selectedCategoryId
  )
  const selectedColor = colors.find((color) => color.id === selectedColorId)
  const selectedSize = sizes.find((size) => size.id === selectedSizeId)
  const normalizedCategorySearch = categorySearch.trim().toLocaleLowerCase()
  const getCategoryName = (category: CategoryDTO) =>
    language === "ru"
      ? category.nameRu || category.name || category.nameEng || "—"
      : category.name || category.nameRu || category.nameEng || "—"
  const filteredParentCategories = parentCategories.filter((category) =>
    getCategoryName(category)
      .toLocaleLowerCase()
      .includes(normalizedCategorySearch)
  )
  const filteredCategories = categories.filter((category) =>
    getCategoryName(category)
      .toLocaleLowerCase()
      .includes(normalizedCategorySearch)
  )
  const isFiltered =
    selectedCategoryId != null ||
    appliedPriceRange[0] !== PRICE_MIN ||
    appliedPriceRange[1] !== PRICE_MAX ||
    selectedColorId != null ||
    selectedSizeId != null

  function navigate(nextView: FilterView) {
    setDirection(nextView === "overview" ? -1 : 1)
    setView(nextView)
    if (nextView !== "categories") setCategorySearch("")
  }

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
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4 sm:px-6 sm:py-5">
        {view !== "overview" ? (
          <motion.button
            type="button"
            aria-label={text.previousPage}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors outline-none hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/40"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("overview")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </motion.button>
        ) : null}
        <h3 className="font-commerce min-w-0 flex-1 text-xl font-bold sm:text-2xl">
          {view === "overview"
            ? text.filters
            : view === "categories"
              ? text.categories
              : view === "colors"
                ? text.colors
                : text.sizes}
        </h3>
        {isFiltered ? (
          <motion.button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            whileTap={{ scale: 0.96 }}
            onClick={onReset}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            {text.clearFilters}
          </motion.button>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {view === "categories" ? (
            <motion.div
              key="categories"
              custom={direction}
              variants={filterViewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <label className="relative block">
                <span className="sr-only">{text.searchCategories}</span>
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="search"
                  value={categorySearch}
                  placeholder={text.searchCategories}
                  className="h-14 w-full rounded-2xl bg-muted/70 pr-4 pl-12 text-base font-medium transition outline-none focus:ring-2 focus:ring-primary/30"
                  onChange={(event) => setCategorySearch(event.target.value)}
                />
              </label>

              {parentCategories.length ? (
                <fieldset className="mt-5">
                  <legend className="sr-only">{text.categories}</legend>
                  <div className="flex flex-col gap-2">
                    {!normalizedCategorySearch ? (
                      <motion.button
                        type="button"
                        aria-pressed={selectedCategoryId == null}
                        className={cn(
                          "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-base",
                          selectedCategoryId == null
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                            : "bg-muted/60 text-foreground hover:bg-muted"
                        )}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => onCategoryChange(null)}
                      >
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-lg border",
                            selectedCategoryId == null
                              ? "border-primary-foreground/40 bg-primary-foreground/15"
                              : "border-border bg-background/40"
                          )}
                        >
                          {selectedCategoryId == null ? (
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              className="size-4"
                            />
                          ) : null}
                        </span>
                        {text.allCategories}
                      </motion.button>
                    ) : null}
                    {filteredParentCategories.map((category, index) => {
                      if (category.id == null) return null
                      const name = getCategoryName(category)
                      const selected = selectedCategoryId === category.id

                      return (
                        <motion.button
                          key={category.id}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-base",
                            selected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                              : "bg-muted/60 text-foreground hover:bg-muted"
                          )}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.035 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => onCategoryChange(category.id!)}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-lg border",
                              selected
                                ? "border-primary-foreground/40 bg-primary-foreground/15"
                                : "border-border bg-background/40"
                            )}
                          >
                            {selected ? (
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                className="size-4"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0 break-words">{name}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </fieldset>
              ) : null}

              {filteredCategories.length ? (
                <fieldset className="mt-6 border-t pt-5">
                  <legend className="text-sm font-semibold">
                    {text.subcategories}
                  </legend>
                  <div className="mt-3 flex flex-col gap-2">
                    {filteredCategories.map((category, index) => {
                      if (category.id == null) return null
                      const name = getCategoryName(category)
                      const selected = selectedCategoryId === category.id

                      return (
                        <motion.button
                          key={category.id}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-base",
                            selected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                              : "bg-muted/60 text-foreground hover:bg-muted"
                          )}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.035 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => onCategoryChange(category.id!)}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-lg border",
                              selected
                                ? "border-primary-foreground/40 bg-primary-foreground/15"
                                : "border-border bg-background/40"
                            )}
                          >
                            {selected ? (
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                className="size-4"
                              />
                            ) : null}
                          </span>
                          {name}
                        </motion.button>
                      )
                    })}
                  </div>
                </fieldset>
              ) : null}
            </motion.div>
          ) : null}

          {view === "overview" ? (
            <motion.div
              key="overview"
              custom={direction}
              variants={filterViewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="space-y-3"
            >
              {[
                {
                  view: "categories" as const,
                  label: text.categories,
                  value: selectedCategory
                    ? getCategoryName(selectedCategory)
                    : text.allCategories,
                },
                {
                  view: "colors" as const,
                  label: text.colors,
                  value: selectedColor
                    ? getCatalogColorName(selectedColor, language, text)
                    : null,
                },
                {
                  view: "sizes" as const,
                  label: text.sizes,
                  value: selectedSize?.value || null,
                },
              ].map((item, index) => (
                <motion.button
                  key={item.view}
                  type="button"
                  className="flex min-h-16 w-full items-center gap-4 rounded-3xl bg-muted/55 px-5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => navigate(item.view)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold sm:text-lg">
                      {item.label}
                    </span>
                    {item.value ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
                        {item.value}
                      </span>
                    ) : null}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-5 shrink-0 text-muted-foreground"
                  />
                </motion.button>
              ))}

              <motion.fieldset
                className="rounded-3xl bg-muted/40 p-5"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <legend className="text-sm font-semibold">
                  {text.priceRange}
                </legend>
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
                          Math.max(
                            PRICE_MIN,
                            Math.min(value, draftPriceRange[1])
                          )
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
              </motion.fieldset>
            </motion.div>
          ) : null}

          {view === "colors" ? (
            <motion.div
              key="colors"
              custom={direction}
              variants={filterViewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <fieldset>
                <legend className="sr-only">{text.colors}</legend>
                {colors.length ? (
                  <>
                    <div className="mt-3 space-y-1">
                      {colors.map((color) => {
                        if (color.id == null) return null
                        const name = getCatalogColorName(color, language, text)

                        return (
                          <motion.button
                            key={color.id}
                            type="button"
                            aria-pressed={selectedColorId === color.id}
                            className={cn(
                              "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-base",
                              selectedColorId === color.id
                                ? "bg-primary/12 font-semibold text-primary ring-1 ring-primary/25"
                                : "hover:bg-muted"
                            )}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => onColorChange(color.id!)}
                          >
                            <span
                              aria-hidden="true"
                              className="size-5 shrink-0 rounded-full border border-black/10 shadow-sm"
                              style={{
                                backgroundColor: getColorHex(color.hexCode),
                              }}
                            />
                            <span className="truncate">
                              {name || text.unnamedColor}
                            </span>
                          </motion.button>
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
            </motion.div>
          ) : null}

          {view === "sizes" ? (
            <motion.div
              key="sizes"
              custom={direction}
              variants={filterViewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <fieldset>
                <legend className="sr-only">{text.sizes}</legend>
                {sizes.length ? (
                  <div className="mt-3 space-y-1">
                    {sizes.map((size, index) => {
                      if (size.id == null) return null
                      const selected = selectedSizeId === size.id

                      return (
                        <motion.button
                          key={size.id}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-base",
                            selected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                              : "bg-muted/60 text-foreground hover:bg-muted"
                          )}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.035 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => onSizeChange(size.id!)}
                        >
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-lg border",
                              selected
                                ? "border-primary-foreground/40 bg-primary-foreground/15"
                                : "border-border bg-background/40"
                            )}
                          >
                            {selected ? (
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                className="size-4"
                              />
                            ) : null}
                          </span>
                          <span>{size.value || "—"}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {optionsLoading ? text.loadingOptions : text.noOptions}
                  </p>
                )}
              </fieldset>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-background/95 p-4 backdrop-blur sm:px-6">
        <motion.div whileTap={{ scale: 0.985 }}>
          <Button
            type="button"
            className="h-12 w-full rounded-2xl text-base font-semibold"
            onClick={onClose}
          >
            {text.applyFilters}
          </Button>
        </motion.div>
      </footer>
    </div>
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
