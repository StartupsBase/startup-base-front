"use client"

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

export function UserDropdown({ language }: { language: string }) {
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
    setEnabled(hasAuthToken())
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
        className="xs:h-9 xs:px-2 xs:text-[11px] 2xs:px-2.5 2xs:text-xs 3xl:h-12 3xl:text-base h-8 shrink-0 rounded-full px-1.5 text-[10px] sm:h-10 sm:px-3 sm:text-sm lg:h-9 xl:h-10 2xl:h-11 2xl:px-4"
      >
        <Link href={`/${language}/login`}>
          <span className="max-[339px]:sr-only">{t("home.loginAction")}</span>
          <span aria-hidden="true" className="hidden max-[339px]:inline">
            ↗
          </span>
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
          className="xs:h-9 xs:max-w-20 xs:gap-1.5 xs:px-2 xs:text-[11px] 2xs:max-w-24 2xs:text-xs 3xl:h-12 3xl:max-w-48 3xl:text-base h-8 max-w-16 justify-start gap-1 truncate rounded-full px-1.5 text-[10px] sm:h-10 sm:max-w-36 sm:gap-2 sm:px-3 sm:text-sm lg:h-9 lg:max-w-28 xl:h-10 xl:max-w-36 2xl:h-11 2xl:max-w-44"
        >
          {currentUser.photo?.s3Url ? (
            <img
              src={currentUser.photo.s3Url}
              alt=""
              className="xs:size-[18px] size-4 shrink-0 rounded-full object-cover sm:size-5 2xl:size-6"
            />
          ) : null}
          {name || contact || t("home.account")}
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
