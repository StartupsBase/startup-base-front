"use client"

import { Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { LanguageSwitcher } from "@/components/language-switcher"
import { LogoBrand } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Language } from "@/i18n/config"
import { useMe1 } from "@/lib/api"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { UserDropdown } from "../../_components/user-dropdown"

export function DashboardShell({
  children,
  language,
}: {
  children: React.ReactNode
  language: Language
}) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const canManageOrganizations =
    meQuery.data?.roles?.some(
      (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
    ) ?? false
  const isOrganizationsPage = pathname.startsWith(
    `/dashboard/organizations`
  )
  const isAdministrationPage = pathname.startsWith(
    `/dashboard/adminstration`
  )
  const isDashboardPage = pathname === `/${language}/dashboard`
  const userName = [meQuery.data?.firstname, meQuery.data?.lastname]
    .filter(Boolean)
    .join(" ")

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (!meQuery.isError) return
    clearAuthToken()
    clearUser()
    router.replace(`/${language}/login`)
  }, [clearUser, language, meQuery.isError, router])

  function signOut() {
    clearAuthToken()
    clearUser()
    queryClient.clear()
    router.replace(`/${language}/login`)
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <LogoBrand />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("dashboard.navigation")}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isDashboardPage}
                    tooltip={t("dashboard.title")}
                  >
                    <Link href={`/${language}/dashboard`}>
                      <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                      <span>{t("dashboard.title")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canManageOrganizations ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isAdministrationPage}
                      tooltip={t("administration.title")}
                    >
                      <Link href={`/dashboard/adminstration`}>
                        <span>{t("administration.title")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                {canManageOrganizations ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isOrganizationsPage}
                      tooltip={t("dashboard.organizations")}
                    >
                      <Link href={`/dashboard/organizations`}>
                        <span>{t("dashboard.organizations")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <p className="truncate px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {userName || meQuery.data?.email || t("dashboard.loadingAccount")}
            </p>
            <Button variant="outline" size="sm" onClick={signOut}>
              {t("dashboard.signOut")}
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-end rounded-lg bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
            <div className="flex items-center gap-2">
              <LanguageSwitcher language={language} className="size-9" />
              <ThemeToggle className="size-9" />
              <UserDropdown language={language} />
            </div>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
