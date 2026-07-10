"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { type UserDTO, useGetAll5, useMe1 } from "@/lib/api"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Logo } from "@/components/logo"
import { Button } from "@workspace/ui/components/button"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"
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
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { status?: number }

    if (response.status === 403) {
      return t("dashboard.accessDenied")
    }
  }

  return t("dashboard.loadFailed")
}

export function Dashboard({ language }: { language: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const usersQuery = useGetAll5({
    query: { enabled: meQuery.isSuccess, retry: false },
  })

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

  const users = usersQuery.data ?? []
  const userName = [meQuery.data?.firstname, meQuery.data?.lastname]
    .filter(Boolean)
    .join(" ")
  const columns = useMemo<ColumnDef<UserDTO>[]>(
    () => [
      {
        id: "name",
        accessorFn: (user) =>
          [user.firstname, user.lastname].filter(Boolean).join(" "),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.name")} />
        ),
        cell: ({ row }) => row.getValue<string>("name") || "—",
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.email")} />
        ),
        cell: ({ row }) => row.getValue<string>("email") || "—",
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.phone")} />
        ),
        cell: ({ row }) => row.getValue<string>("phone") || "—",
      },
      {
        id: "roles",
        accessorFn: (user) => user.roles?.join(" ") ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.roles")} />
        ),
        cell: ({ row }) =>
          row.getValue<string>("roles") || t("dashboard.customer"),
      },
    ],
    [t]
  )

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <Link
              href={`/${language}`}
              aria-label="Humayro"
              className="flex items-center gap-3 px-2 py-2 font-semibold group-data-[collapsible=icon]:justify-center"
            >
              <Logo className="size-8 text-primary transition-all group-data-[collapsible=icon]:size-6" />
              <span className="group-data-[collapsible=icon]:hidden">Humayro</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("dashboard.navigation")}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive tooltip={t("dashboard.title")}>
                    <Link href={`/${language}/dashboard`}>
                      <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                      <span>{t("dashboard.title")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
          <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <SidebarTrigger className="mb-3" />
            <p className="text-sm font-medium text-primary">{t("dashboard.admin")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {t("dashboard.title")}
            </h1>
          </div>
        </header>

        <section className="py-8">
          {usersQuery.isLoading || meQuery.isLoading ? (
            <p className="text-muted-foreground">{t("dashboard.loadingUsers")}</p>
          ) : usersQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
              {getErrorMessage(usersQuery.error, t)}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              searchColumn="name"
              searchPlaceholder={t("dashboard.search")}
              filters={[
                {
                  columnId: "roles",
                  title: t("dashboard.roles"),
                  options: [
                    { label: "Admin", value: "ADMIN" },
                    { label: t("dashboard.customer"), value: "USER" },
                  ],
                },
              ]}
              enableRowSelection
              emptyMessage={t("dashboard.empty")}
              labels={{
                resetFilters: t("dashboard.resetFilters"),
                columns: t("dashboard.columns"),
                rowsPerPage: t("dashboard.rowsPerPage"),
                selectedRows: (selected, total) =>
                  t("dashboard.selectedRows", { selected, total }),
                page: (page, total) => t("dashboard.page", { page, total }),
                previous: t("dashboard.previous"),
                next: t("dashboard.next"),
              }}
            />
          )}
        </section>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
