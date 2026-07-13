"use client"

import { useGetAll4 } from "@/lib/api/generated/category/category"
import { useGetFavoriteIds } from "@/lib/api/generated/favorite/favorite"
import { useGetAll2 } from "@/lib/api/generated/product/product"
import type { Language } from "@/i18n/config"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useCatalogStore, type CatalogSort } from "@/lib/stores/use-catalog-store"
import { Button } from "@workspace/ui/components/button"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import { ProductCard } from "./product-card"
import { useStorefrontActions } from "./use-storefront-actions"

const sortMap: Record<CatalogSort, string> = {
  newest: "id,desc",
  "price-low": "discountedPrice,asc",
  "price-high": "discountedPrice,desc",
}

export function CatalogSection({ language }: { language: Language }) {
  const text = useStorefrontCopy()
  const hasToken = useHasAuthToken()
  const categoryId = useCatalogStore((state) => state.categoryId)
  const sort = useCatalogStore((state) => state.sort)
  const setCategoryId = useCatalogStore((state) => state.setCategoryId)
  const setSort = useCatalogStore((state) => state.setSort)
  const actions = useStorefrontActions(language)

  const categoriesQuery = useGetAll4(
    { active: true },
    { query: { staleTime: 5 * 60_000 } }
  )
  const productsQuery = useGetAll2(
    {
      active: true,
      categoryId: categoryId ?? undefined,
      sort: sortMap[sort],
      page: 0,
      size: 12,
    },
    { query: { retry: 1 } }
  )
  const favoritesQuery = useGetFavoriteIds({
    query: { enabled: hasToken, retry: false },
  })

  const products = productsQuery.data?.content ?? []
  const favoriteIds = new Set(favoritesQuery.data ?? [])
  const sortLabels: Record<CatalogSort, string> = {
    newest: text.newest,
    "price-low": text.priceLow,
    "price-high": text.priceHigh,
  }

  return (
    <section id="catalog" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-[1580px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">
              {text.catalogEyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {text.catalogTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {text.catalogDescription}
            </p>
          </div>

          <Select value={sort} onValueChange={(value) => setSort(value as CatalogSort)}>
            <SelectTrigger className="h-11 min-w-48 rounded-2xl bg-background">
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
        </div>

        <div className="mt-9 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            className={cn(
              "shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
              categoryId == null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/50"
            )}
            onClick={() => setCategoryId(null)}
          >
            {text.allCategories}
          </button>
          {categoriesQuery.data?.map((category) => {
            if (category.id == null) return null
            const name =
              language === "ru"
                ? category.nameRu || category.name || category.nameEng
                : category.name || category.nameRu || category.nameEng

            return (
              <button
                key={category.id}
                type="button"
                className={cn(
                  "shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
                  categoryId === category.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50"
                )}
                onClick={() => setCategoryId(category.id ?? null)}
              >
                {name || "—"}
              </button>
            )
          })}
        </div>

        {productsQuery.isPending ? (
          <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-muted" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-11 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div className="mt-10 rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center">
            <p className="text-destructive">{text.productsError}</p>
            <Button className="mt-4" onClick={() => productsQuery.refetch()}>
              {text.retry}
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed p-16 text-center text-muted-foreground">
            {text.noProducts}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id ?? index}
                product={product}
                language={language}
                isFavorite={product.id != null && favoriteIds.has(product.id)}
                isAdding={actions.pendingCartId === product.id}
                isTogglingFavorite={actions.pendingFavoriteId === product.id}
                onAddToCart={actions.addProductToCart}
                onToggleFavorite={actions.toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
