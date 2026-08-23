"use client"

import Link from "next/link"

import type { Language } from "@/i18n/config"
import { useGetFavorites } from "@/lib/api/generated/favorite/favorite"
import { useGetAll2 } from "@/lib/api/generated/product/product"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"

import { EmptyState } from "../../_components/storefront/empty-state"
import { ProductCard } from "../../_components/storefront/product-card"
import { useStorefrontActions } from "../../_components/storefront/use-storefront-actions"

export function FavouritesView({ language }: { language: Language }) {
  const text = useStorefrontCopy()
  const hasToken = useHasAuthToken()
  const actions = useStorefrontActions(language)
  const favoritesQuery = useGetFavorites({
    query: { enabled: hasToken, retry: false },
  })
  const guestProductsQuery = useGetAll2(
    { active: true, page: toApiPage(FIRST_PAGE), size: 100 },
    { query: { enabled: !hasToken, staleTime: 60_000 } }
  )

  if (
    (hasToken && favoritesQuery.isPending) ||
    (!hasToken && guestProductsQuery.isPending)
  ) {
    return <PageSkeleton />
  }

  if (
    (hasToken && favoritesQuery.isError) ||
    (!hasToken && guestProductsQuery.isError)
  ) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-destructive">{text.actionError}</p>
        <Button
          className="mt-4"
          onClick={() =>
            hasToken ? favoritesQuery.refetch() : guestProductsQuery.refetch()
          }
        >
          {text.retry}
        </Button>
      </div>
    )
  }

  const products = hasToken
    ? (favoritesQuery.data ?? [])
    : (guestProductsQuery.data?.content ?? []).filter(
        (product) =>
          product.id != null && actions.guestFavoriteIds.includes(product.id)
      )

  if (products.length === 0) {
    return (
      <EmptyState
        icon="heart"
        title={text.favoritesEmptyTitle}
        description={text.favoritesEmptyDescription}
        actionLabel={text.popularProducts}
        actionHref={`/${language}/#catalog`}
      />
    )
  }

  return (
    <main className="min-h-screen px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {text.favoritesTitle}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {text.favoritesDescription}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href={`/${language}/#catalog`}>{text.popularProducts}</Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product, index) => (
            <ProductCard
              key={product.id ?? index}
              product={product}
              language={language}
              isFavorite
              isAdding={actions.pendingCartId === product.id}
              isTogglingFavorite={actions.pendingFavoriteId === product.id}
              onAddToCart={actions.addProductToCart}
              onToggleFavorite={actions.toggleFavorite}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

function PageSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-[1580px] px-4 py-20 sm:px-6">
      <div className="h-12 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-muted" />
        ))}
      </div>
    </main>
  )
}
