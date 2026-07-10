"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { type UserDTO, useGetAll5, useMe1 } from "@/lib/api"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"

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
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <p className="text-sm font-medium text-primary">{t("dashboard.admin")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {t("dashboard.title")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-muted-foreground sm:block">
              {userName || meQuery.data?.email || t("dashboard.loadingAccount")}
            </p>
            <Button variant="outline" onClick={signOut}>
              {t("dashboard.signOut")}
            </Button>
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
    </main>
  )
}
