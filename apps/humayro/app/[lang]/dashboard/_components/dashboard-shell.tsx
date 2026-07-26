"use client"

import {
  Building03Icon,
  Home01Icon,
  Logout02Icon,
  PlayStoreIcon,
  Settings02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo, LogoBrand } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Language } from "@/i18n/config"
import { useMe1 } from "@/lib/api"
import { clearAuthToken } from "@/lib/auth-client"
import { HUMAYRO_PLAY_MARKET_URL } from "@/lib/constants"
import { useAuthStore } from "@/lib/stores/use-auth-store"
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
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
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
  const dashboardHref = `/${language}/dashboard`
  const administrationHref = `${dashboardHref}/adminstration`
  const organizationsHref = `${dashboardHref}/organizations`
  const profileHref = `${dashboardHref}/profile`
  const isOrganizationsPage = pathname.startsWith(organizationsHref)
  const isAdministrationPage = pathname.startsWith(administrationHref)
  const isDashboardPage = pathname === dashboardHref
  const isProfilePage = pathname.startsWith(profileHref)
  const userName = [meQuery.data?.firstname, meQuery.data?.lastname]
    .filter(Boolean)
    .join(" ")
  const playMarketLabel =
    language === "uz" ? "Google Play'da mavjud" : "Доступно в Google Play"

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
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--sidebar-width-icon": "4rem",
          } as React.CSSProperties
        }
      >
        <CloseSidebarOnOutsideInteraction />
        <Sidebar
          collapsible="icon"
          variant="inset"
          className="[&_[data-slot=sidebar-inner]]:m-2 [&_[data-slot=sidebar-inner]]:rounded-2xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-sidebar-border/80 [&_[data-slot=sidebar-inner]]:shadow-[0_18px_50px_-36px_rgba(0,0,0,.65)]"
        >
          <SidebarHeader className="min-h-20 justify-center rounded-2xl px-3 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
            <div className="group-data-[collapsible=icon]:hidden">
              <LogoBrand />
            </div>
            <Link
              href={`/${language}`}
              aria-label="Humayro"
              className="hidden size-11 place-items-center rounded-2xl bg-primary shadow-sm ring-1 ring-primary/30 transition group-data-[collapsible=icon]:grid hover:scale-[1.03]"
            >
              <Logo className="size-9" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="group-data-[collapsible=icon]:px-2">
              <SidebarGroupLabel>{t("dashboard.navigation")}</SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isDashboardPage}
                    tooltip={sidebarTooltip(t("dashboard.home"))}
                    className="h-12 rounded-2xl px-2.5 font-semibold group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-md"
                  >
                    <Link href={dashboardHref}>
                      <DashboardNavIcon icon={Home01Icon} />
                      <span className="text-[15px] font-bold text-sidebar-foreground group-data-[active=true]/menu-button:text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                        {t("dashboard.home")}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {canManageOrganizations ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isAdministrationPage}
                      tooltip={sidebarTooltip(t("administration.title"))}
                      className="h-12 rounded-2xl px-2.5 font-semibold group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-md"
                    >
                      <Link href={administrationHref}>
                        <DashboardNavIcon icon={Settings02Icon} />
                        <span className="text-[15px] font-bold text-sidebar-foreground group-data-[active=true]/menu-button:text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                          {t("administration.title")}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                {canManageOrganizations ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isOrganizationsPage}
                      tooltip={sidebarTooltip(t("dashboard.organizations"))}
                      className="h-12 rounded-2xl px-2.5 font-semibold group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-md"
                    >
                      <Link href={organizationsHref}>
                        <DashboardNavIcon icon={Building03Icon} />
                        <span className="text-[15px] font-bold text-sidebar-foreground group-data-[active=true]/menu-button:text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                          {t("dashboard.organizations")}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isProfilePage}
                    tooltip={sidebarTooltip(t("profile.title"))}
                    className="h-12 rounded-2xl px-2.5 font-semibold group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-md"
                  >
                    <Link href={profileHref}>
                      <DashboardNavIcon icon={UserCircleIcon} />
                      <span className="text-[15px] font-bold text-sidebar-foreground group-data-[active=true]/menu-button:text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                        {t("profile.title")}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={sidebarTooltip(playMarketLabel)}
              className="h-12 rounded-2xl border border-primary/20 bg-primary/8 px-2.5 font-semibold text-primary shadow-sm group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:border-primary/35 hover:bg-primary/14 hover:text-primary"
            >
              <a
                href={HUMAYRO_PLAY_MARKET_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <HugeiconsIcon icon={PlayStoreIcon} className="size-5!" />
                </span>
                <span className="text-[15px] font-bold group-data-[collapsible=icon]:hidden">
                  {playMarketLabel}
                </span>
              </a>
            </SidebarMenuButton>
            <p className="truncate px-2 text-sm font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {userName || meQuery.data?.email || t("dashboard.loadingAccount")}
            </p>
            <SidebarMenuButton
              size="lg"
              tooltip={sidebarTooltip(t("dashboard.signOut"))}
              className="h-12 rounded-2xl border border-sidebar-border bg-background px-2.5 font-semibold shadow-sm group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={signOut}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Logout02Icon} className="size-5!" />
              </span>
              <span className="text-[15px] font-bold group-data-[collapsible=icon]:hidden">
                {t("dashboard.signOut")}
              </span>
            </SidebarMenuButton>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="min-w-0 overflow-x-clip md:my-3 md:mr-3 md:rounded-[2rem]! md:border md:border-border/70 md:shadow-[0_24px_70px_-48px_rgba(0,0,0,.7)]">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4 md:border-b-0 md:px-6">
            <LogoBrand className="md:hidden" />
            <SidebarTrigger className="hidden size-10 rounded-xl border bg-background shadow-sm md:inline-flex" />
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher language={language} className="size-10" />
              <ThemeToggle className="size-10" />
              <UserDropdown language={language} />
            </div>
          </header>
          <main className="w-full max-w-full min-w-0 overflow-x-hidden pb-24 md:pb-0">
            {children}
          </main>
          <nav
            aria-label={t("dashboard.navigation")}
            className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-24px_rgba(0,0,0,.55)] backdrop-blur-xl md:hidden"
          >
            <div
              className={cn(
                "mx-auto grid max-w-xl gap-1",
                canManageOrganizations ? "grid-cols-4" : "grid-cols-2"
              )}
            >
              <MobileNavItem
                href={dashboardHref}
                label={t("dashboard.home")}
                active={isDashboardPage}
                icon={Home01Icon}
              />
              {canManageOrganizations ? (
                <MobileNavItem
                  href={administrationHref}
                  label={t("administration.title")}
                  active={isAdministrationPage}
                  icon={Settings02Icon}
                />
              ) : null}
              {canManageOrganizations ? (
                <MobileNavItem
                  href={organizationsHref}
                  label={t("dashboard.organizations")}
                  active={isOrganizationsPage}
                  icon={Building03Icon}
                />
              ) : null}
              <MobileNavItem
                href={profileHref}
                label={t("profile.title")}
                active={isProfilePage}
                icon={UserCircleIcon}
              />
            </div>
          </nav>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function CloseSidebarOnOutsideInteraction() {
  const { isMobile, open, setOpen } = useSidebar()

  useEffect(() => {
    if (isMobile || !open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Element)) return

      const clickedSidebarControl = target.closest(
        '[data-sidebar="sidebar"], [data-sidebar="trigger"], [data-sidebar="rail"]'
      )

      if (!clickedSidebarControl) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMobile, open, setOpen])

  return null
}

function MobileNavItem({
  active,
  href,
  icon,
  label,
}: {
  active: boolean
  href: string
  icon: typeof Home01Icon
  label: string
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold text-muted-foreground transition-colors",
        active && "bg-primary/10 text-primary"
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl bg-muted transition-colors",
          active && "bg-primary text-primary-foreground shadow-sm"
        )}
      >
        <HugeiconsIcon
          icon={icon}
          strokeWidth={active ? 2.4 : 2}
          className="size-5"
        />
      </span>
      <span className="w-full truncate text-center">{label}</span>
    </Link>
  )
}

function DashboardNavIcon({ icon }: { icon: typeof Home01Icon }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/60 transition-colors group-data-[active=true]/menu-button:bg-sidebar-primary-foreground/15 group-data-[active=true]/menu-button:text-sidebar-primary-foreground group-data-[active=true]/menu-button:ring-sidebar-primary-foreground/20">
      <HugeiconsIcon icon={icon} strokeWidth={2.2} className="size-5!" />
    </span>
  )
}

function sidebarTooltip(label: string) {
  return {
    children: label,
    sideOffset: 12,
    className:
      "rounded-xl px-3.5 py-2 text-sm font-bold shadow-xl ring-1 ring-background/10",
  }
}
