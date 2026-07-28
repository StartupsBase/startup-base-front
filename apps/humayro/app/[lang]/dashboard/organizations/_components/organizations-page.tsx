"use client"

import { PencilEdit02Icon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useMe1, type OrganizationDTO } from "@/lib/api"
import {
  getGetAll6QueryKey,
  useDelete6,
  useGetAll6,
} from "@/lib/api/generated/admin-organization/admin-organization"
import { clearAuthToken } from "@/lib/auth-client"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"
import { OrganizationForm } from "./organization-form"

export function OrganizationsPage({ language }: { language: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const canManageOrganizations =
    meQuery.data?.roles?.includes("ROLE_SUPER_ADMIN") ?? false
  const organizationsQuery = useGetAll6(undefined, {
    query: { enabled: canManageOrganizations, retry: false },
  })
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (!meQuery.isError) return

    clearAuthToken()
    clearUser()
    router.replace(`/${language}/login`)
  }, [clearUser, language, meQuery.isError, router])

  useEffect(() => {
    if (meQuery.isSuccess && !canManageOrganizations) {
      router.replace(`/${language}/dashboard`)
    }
  }, [canManageOrganizations, language, meQuery.isSuccess, router])

  function signOut() {
    clearAuthToken()
    clearUser()
    queryClient.clear()
    router.replace(`/${language}/login`)
  }

  const userName = [meQuery.data?.firstname, meQuery.data?.lastname]
    .filter(Boolean)
    .join(" ")
  const columns = useMemo<ColumnDef<OrganizationDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("organization.name")}
          />
        ),
        cell: ({ row }) =>
          row.original.id === undefined ? (
            row.getValue<string>("name") || "—"
          ) : (
            <Link
              href={`/${language}/dashboard/organizations/${row.original.id}`}
              className="flex items-center gap-3 font-medium text-primary hover:underline"
            >
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-sm font-semibold text-muted-foreground">
                {row.original.logo?.s3Url ? (
                  <img
                    src={row.original.logo.s3Url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  (row.getValue<string>("name") || "?").slice(0, 1)
                )}
              </span>
              <span>{row.getValue<string>("name") || "—"}</span>
            </Link>
          ),
      },
      {
        id: "contact",
        accessorFn: (organization) =>
          [
            organization.contactPerson,
            organization.contactEmail,
            organization.contactPhone,
          ]
            .filter(Boolean)
            .join(" "),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("organization.contact")}
          />
        ),
        cell: ({ row }) => {
          const { contactPerson, contactEmail, contactPhone } = row.original
          const formattedPhone = contactPhone
            ? formatPhoneNumberInternal(contactPhone)
            : null

          return (
            [contactPerson, contactEmail, formattedPhone]
              .filter(Boolean)
              .join(" ") || "—"
          )
        },
      },
      {
        accessorKey: "inn",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="INN" />
        ),
        cell: ({ row }) => row.getValue<string>("inn") || "—",
      },
      {
        id: "status",
        accessorFn: (organization) => String(organization.active ?? true),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("organization.status")}
          />
        ),
        cell: ({ row }) => (
          <span
            className={
              row.original.active === false
                ? "text-muted-foreground"
                : "text-emerald-600"
            }
          >
            {row.original.active === false
              ? t("organization.inactive")
              : t("organization.active")}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <OrganizationActions organization={row.original} />,
      },
    ],
    [language, t]
  )

  if (meQuery.isLoading || !canManageOrganizations) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: t("dashboard.organizations") }]}
      />
      <header className="mt-6 flex flex-col items-stretch gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {t("dashboard.admin")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("dashboard.organizations")}
          </h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              {t("organization.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("organization.new")}</DialogTitle>
              <DialogDescription>
                {t("organization.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <OrganizationForm onComplete={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <section className="py-8">
        {organizationsQuery.isLoading ? (
          <p className="text-muted-foreground">{t("organization.loading")}</p>
        ) : organizationsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            {t("organization.loadFailed")}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={organizationsQuery.data ?? []}
            searchColumn="name"
            searchPlaceholder={t("organization.search")}
            emptyMessage={t("organization.empty")}
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
  )
}

function OrganizationActions({
  organization,
}: {
  organization: OrganizationDTO
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const remove = useDelete6()
  const [editOpen, setEditOpen] = useState(false)

  async function deleteOrganization() {
    if (organization.id === undefined) return
    try {
      await remove.mutateAsync({ id: organization.id })
      await queryClient.invalidateQueries({ queryKey: getGetAll6QueryKey() })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("organization.edit")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("organization.edit")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("organization.edit")}</DialogTitle>
            <DialogDescription>{organization.name}</DialogDescription>
          </DialogHeader>
          <OrganizationForm
            organization={organization}
            onComplete={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("organization.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("organization.delete")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-64 gap-3">
          <p className="text-sm">{t("organization.deleteConfirm")}</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={remove.isPending}
            onClick={deleteOrganization}
          >
            {t("organization.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
