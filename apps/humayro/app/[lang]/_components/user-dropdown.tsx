"use client"

import { UserCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMe1 } from "@/lib/api"
import { clearAuthToken, hasAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

export function UserDropdown({
  language,
  compact = false,
}: {
  language: string
  compact?: boolean
}) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(!!hasAuthToken())
  const user = useAuthStore((state) => state.user)
  const identifier = useAuthStore((state) => state.identifier)
  const setUser = useAuthStore((state) => state.setUser)
  const clear = useAuthStore((state) => state.clear)
  const pathname = usePathname()
  const meQuery = useMe1({ query: { enabled, retry: false } })
  const currentUser = meQuery.data ?? user
  const name = [currentUser?.firstname, currentUser?.lastname]
    .filter(Boolean)
    .join(" ")
  const contact = identifier ?? currentUser?.email ?? currentUser?.phone

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEnabled(hasAuthToken())
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (!meQuery.isError) return

    clearAuthToken()
    clear()
  }, [clear, meQuery.isError])

  function signOut() {
    clearAuthToken()
    clear()
    queryClient.clear()
    window.location.assign(`/${language}`)
  }

  if (!currentUser) {
    return (
      <Button
        asChild
        variant="ghost"
        className={cn(
          "shrink-0 rounded-full",
          compact
            ? "size-11 px-0"
            : "xs:h-9 xs:px-2 xs:text-[11px] 2xs:px-2.5 2xs:text-xs 3xl:h-12 3xl:text-base h-8 px-1.5 text-[10px] sm:h-10 sm:px-3 sm:text-sm lg:h-9 xl:h-10 2xl:h-11 2xl:px-4"
        )}
      >
        <Link
          href={`/${language}/login`}
          aria-label={compact ? t("home.loginAction") : undefined}
        >
          {compact ? (
            <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
          ) : (
            t("home.loginAction")
          )}
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={
            compact ? name || contact || t("home.account") : undefined
          }
          className={cn(
            "truncate rounded-full",
            compact
              ? "size-11 justify-center px-0"
              : "3xl:h-12 3xl:max-w-48 3xl:text-base h-10 max-w-36 justify-start gap-2 px-3 text-sm lg:h-9 lg:max-w-28 xl:h-10 xl:max-w-36 2xl:h-11 2xl:max-w-44"
          )}
        >
          {currentUser.photo?.s3Url ? (
            <img
              src={currentUser.photo.s3Url}
              alt=""
              className={cn(
                "shrink-0 rounded-full object-cover",
                compact ? "size-6" : "xs:size-4.5 size-4 sm:size-5 2xl:size-6"
              )}
            />
          ) : compact ? (
            <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
          ) : null}
          <p className="hidden sm:block">
            {!compact ? name || contact || t("home.account") : null}
          </p>
          <HugeiconsIcon className="block sm:hidden size-5.5" icon={UserCircleIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 shadow-none">
        <DropdownMenuLabel className="space-y-1 px-3 py-2">
          {currentUser.photo?.s3Url ? (
            <img
              src={currentUser.photo.s3Url}
              alt=""
              className="mb-2 size-10 rounded-full object-cover"
            />
          ) : null}
          <p className="truncate font-medium">{name || t("home.account")}</p>
          {contact ? (
            <p className="truncate text-xs font-normal text-muted-foreground">
              {contact}
            </p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${language}/dashboard/profile`}>
            {t("profile.title")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${language}/orders`}>{t("storefront.myOrders")}</Link>
        </DropdownMenuItem>
        {pathname !== `/${language}/dashboard` && (
          <DropdownMenuItem asChild>
            <Link href={`/${language}/dashboard`}>
              {t("home.landingAction")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={signOut}
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          {t("home.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
