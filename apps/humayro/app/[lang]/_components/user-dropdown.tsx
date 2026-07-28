"use client"

import {
  Home01Icon,
  Logout02Icon,
  ShoppingCart02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMe1 } from "@/lib/api"
import { getDashboardLandingPath, hasDashboardRole } from "@/lib/auth"
import { clearAuthToken, hasAuthToken } from "@/lib/auth-client"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
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
  const contact = formatPhoneNumberInternal(
    identifier ?? currentUser?.email ?? currentUser?.phone ?? ""
  )
  const canAccessDashboard = hasDashboardRole(currentUser?.roles)
  const isDashboardPath = pathname.startsWith(`/${language}/dashboard`)

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
            : "xs:h-9 xs:px-2 xs:text-[11px] 2xs:px-2.5 2xs:text-sm 3xl:h-12 3xl:text-base h-8 px-1.5 text-[10px] sm:h-10 sm:px-3 sm:text-sm lg:h-9 xl:h-10 2xl:h-11 2xl:px-4"
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
            "rounded-full",
            compact
              ? "size-11 justify-center px-0"
              : "size-10 justify-center px-0 md:h-10 md:w-auto md:max-w-52 md:justify-start md:gap-2.5 md:px-2.5 2xl:h-11 2xl:max-w-60 2xl:px-3"
          )}
        >
          {currentUser.photo?.s3Url ? (
            <img
              src={currentUser.photo.s3Url}
              alt=""
              className={cn(
                "shrink-0 rounded-full object-cover",
                compact ? "size-6" : "size-6 md:size-7"
              )}
            />
          ) : (
            <HugeiconsIcon icon={UserCircleIcon} className="size-5 md:size-6" />
          )}
          {!compact ? (
            <span className="hidden min-w-0 flex-col items-start md:flex">
              <span className="max-w-full truncate text-sm leading-4 font-semibold">
                {name || t("home.account")}
              </span>
              {contact ? (
                <span className="max-w-full truncate text-[11px] leading-4 text-muted-foreground">
                  {contact}
                </span>
              ) : null}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-[min(calc(100vw-1rem),15rem)] rounded-xl p-1.5 shadow-xl"
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-2.5 py-2">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-background text-primary ring-1 ring-border">
            {currentUser.photo?.s3Url ? (
              <img
                src={currentUser.photo.s3Url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {name || t("home.account")}
            </span>
            {contact ? (
              <span className="mt-0.5 block truncate text-sm font-normal text-muted-foreground">
                {contact}
              </span>
            ) : null}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          asChild
          className="min-h-9 cursor-pointer px-2.5 text-sm"
        >
          <Link href={`/${language}/dashboard/profile`}>
            <HugeiconsIcon icon={UserCircleIcon} />
            {t("profile.title")}
          </Link>
        </DropdownMenuItem>
        {!canAccessDashboard ? (
          <DropdownMenuItem
            asChild
            className="min-h-9 cursor-pointer px-2.5 text-sm"
          >
            <Link href={`/${language}/orders`}>
              <HugeiconsIcon icon={ShoppingCart02Icon} />
              {t("storefront.myOrders")}
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            asChild
            className="min-h-9 cursor-pointer px-2.5 text-sm"
          >
            <Link
              href={
                isDashboardPath
                  ? `/${language}`
                  : getDashboardLandingPath(language, currentUser)
              }
            >
              <HugeiconsIcon icon={Home01Icon} />
              {t(isDashboardPath ? "home.landingAction" : "dashboard.home")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onSelect={signOut}
          variant="destructive"
          className="min-h-9 cursor-pointer px-2.5 text-sm"
        >
          <HugeiconsIcon icon={Logout02Icon} />
          {t("home.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
