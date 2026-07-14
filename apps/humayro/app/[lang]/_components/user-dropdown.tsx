"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
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
  const [enabled, setEnabled] = useState(false)
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
      <Button asChild variant="ghost">
        <Link href={`/${language}/login`}>{t("home.loginAction")}</Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 max-w-44 justify-start gap-2 truncate px-2 text-xs"
        >
          {currentUser.photo?.s3Url ? (
            <img
              src={currentUser.photo.s3Url}
              alt=""
              className="size-5 rounded-full object-cover"
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
          <Link href={`/${language}/orders`}>
            {t("storefront.myOrders")}
          </Link>
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
