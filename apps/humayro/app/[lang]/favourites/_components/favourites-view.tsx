"use client"

import Link from "next/link"

import type { Language } from "@/i18n/config"
import { useGetFavorites } from "@/lib/api/generated/favorite/favorite"
import { getLoginHref } from "@/lib/storefront"
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

  if (!hasToken) {
    return (
      <EmptyState
        icon="heart"
        title={text.favoritesTitle}
        description={text.signInRequired}
        actionLabel={text.signIn}
        actionHref={getLoginHref(language, `/${language}/favourites`)}
      />
    )
  }

  if (favoritesQuery.isPending) {
    return <PageSkeleton />
  }

  if (favoritesQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-destructive">{text.actionError}</p>
        <Button className="mt-4" onClick={() => favoritesQuery.refetch()}>
          {text.retry}
        </Button>
      </div>
    )
  }

  const products = favoritesQuery.data ?? []

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
      <div className="mx-auto max-w-[1580px]">
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

        <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
