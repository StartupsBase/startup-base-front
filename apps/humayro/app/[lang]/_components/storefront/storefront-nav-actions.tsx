"use client"

import { HeartIcon, ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import type { Language } from "@/i18n/config"
import { useGetCart } from "@/lib/api/generated/cart/cart"
import { useGetFavoriteIds } from "@/lib/api/generated/favorite/favorite"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useGuestStorefront } from "@/lib/guest-storefront"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { cn } from "@workspace/ui/lib/utils"

export function StorefrontNavActions({
  language,
  compact = false,
}: {
  language: Language
  compact?: boolean
}) {
  const hasToken = useHasAuthToken()
  const text = useStorefrontCopy()
  const guestStorefront = useGuestStorefront()
  const cartQuery = useGetCart({
    query: { enabled: hasToken, retry: false },
  })
  const favoritesQuery = useGetFavoriteIds({
    query: { enabled: hasToken, retry: false },
  })
  return (
    <div className="xs:gap-1 flex shrink-0 items-center gap-0.5 xl:gap-1.5 2xl:gap-2">
      <NavAction
        href={`/${language}/favourites`}
        label={text.favoritesNav}
        count={
          hasToken
            ? favoritesQuery.data?.length
            : guestStorefront.favoriteIds.length
        }
        compact={compact}
      >
        <HugeiconsIcon
          icon={HeartIcon}
          className="xs:size-4.5 size-4 sm:size-5 2xl:size-5.5"
        />
      </NavAction>
      <NavAction
        href={`/${language}/cart`}
        label={text.cartNav}
        count={
          hasToken
            ? cartQuery.data?.totalItems
            : guestStorefront.cart.reduce(
                (total, item) => total + item.quantity,
                0
              )
        }
        compact={compact}
      >
        <HugeiconsIcon
          icon={ShoppingCart02Icon}
          className="xs:size-4.5 size-4 sm:size-5 2xl:size-5.5"
        />
      </NavAction>
    </div>
  )
}

function NavAction({
  href,
  label,
  count,
  compact,
  children,
}: {
  href: string
  label: string
  count?: number
  compact: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative flex shrink-0 items-center justify-center gap-2 rounded-full px-0 text-xs font-medium transition hover:bg-muted",
        compact
          ? "size-11"
          : "xs:size-9 3xl:h-12 3xl:px-4 3xl:text-base size-8 sm:size-10 lg:size-9 xl:h-10 xl:w-auto xl:px-3 2xl:h-11 2xl:px-3.5 2xl:text-sm"
      )}
    >
      {children}
      <span className="hidden xl:inline">{label}</span>
      {count != null && count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 grid min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[9px] leading-3.5 font-bold text-primary-foreground",
            compact
              ? "min-w-4 px-1 text-[10px] leading-4"
              : "xs:min-w-4 xs:px-1 xs:text-[10px] xs:leading-4 xl:top-0 xl:right-0 2xl:text-[11px]"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
