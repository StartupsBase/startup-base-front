"use client"

import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import type { Language } from "@/i18n/config"
import { useGetCart } from "@/lib/api/generated/cart/cart"
import { useGetFavoriteIds } from "@/lib/api/generated/favorite/favorite"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { useAuthStore } from "@/lib/stores/use-auth-store"

export function StorefrontNavActions({ language }: { language: Language }) {
  const hasToken = useHasAuthToken()
  const text = useStorefrontCopy()
  const cartQuery = useGetCart({
    query: { enabled: hasToken, retry: false },
  })
  const favoritesQuery = useGetFavoriteIds({
    query: { enabled: hasToken, retry: false },
  })
  const user = useAuthStore((state) => state.user)

  return (
    <>
      <NavAction
        href={`/${language}/favourites`}
        label={text.favoritesNav}
        count={favoritesQuery.data?.length}
      >
        <HugeiconsIcon icon={HeartIcon} className="size-5" />
      </NavAction>
      {user && (
        <NavAction
          href={`/${language}/cart`}
          label={text.cartNav}
          count={cartQuery.data?.totalItems}
        >
          <HugeiconsIcon icon={ShoppingCart02Icon} className="size-5" />
        </NavAction>
      )}
    </>
  )
}

function NavAction({
  href,
  label,
  count,
  children,
}: {
  href: string
  label: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-full transition hover:bg-muted"
    >
      {children}
      {count != null && count > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
