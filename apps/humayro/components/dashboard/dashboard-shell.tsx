"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useMe1 } from "@/lib/api"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import type { Language } from "@/i18n/config"
import { Logo } from "@/components/logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "@/components/user-dropdown"
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

export function DashboardShell({ children, language }: { children: React.ReactNode; language: Language }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const canManageOrganizations = meQuery.data?.roles?.some(
    (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
  ) ?? false
  const isOrganizationsPage = pathname.startsWith(`/${language}/dashboard/organizations`)
  const isAdministrationPage = pathname.startsWith(`/${language}/dashboard/adminstration`)
  const isDashboardPage = pathname === `/${language}/dashboard`
  const userName = [meQuery.data?.firstname, meQuery.data?.lastname].filter(Boolean).join(" ")

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
            <Link href={`/${language}`} aria-label="Humayro" className="flex items-center gap-3 px-2 py-2 font-semibold group-data-[collapsible=icon]:justify-center">
              <Logo className="size-8 text-primary transition-all group-data-[collapsible=icon]:size-6" />
              <span className="group-data-[collapsible=icon]:hidden">Humayro</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("dashboard.navigation")}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isDashboardPage} tooltip={t("dashboard.title")}>
                    <Link href={`/${language}/dashboard`}>
                      <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                      <span>{t("dashboard.title")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canManageOrganizations ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isAdministrationPage} tooltip={t("administration.title")}>
                      <Link href={`/${language}/dashboard/adminstration`}>
                        <span>{t("administration.title")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                {canManageOrganizations ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isOrganizationsPage} tooltip={t("dashboard.organizations")}>
                      <Link href={`/${language}/dashboard/organizations`}>
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
            <Button variant="outline" size="sm" onClick={signOut}>{t("dashboard.signOut")}</Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-end  bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6 rounded-lg">
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
