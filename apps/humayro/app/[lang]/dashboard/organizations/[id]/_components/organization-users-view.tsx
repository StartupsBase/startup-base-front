"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { type UserDTO } from "@/lib/api"
import { useGetAll11 } from "@/lib/api/generated/admin-user/admin-user"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { UserCreateForm } from "../../../_components/user-create-form"
import { UserEditAction } from "../../../_components/user-edit-action"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"

export function OrganizationUsersView({
  organizationId,
}: {
  organizationId: number
}) {
  const { t } = useTranslation()
  const usersQuery = useGetAll11(
    { organizationId },
    { query: { retry: false } }
  )
  const users = useMemo(
    () =>
      (usersQuery.data?.content ?? []).filter(
        (user) => user.organizationId === organizationId
      ),
    [organizationId, usersQuery.data]
  )
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const userColumns = useMemo<ColumnDef<UserDTO>[]>(
    () => [
      {
        id: "name",
        accessorFn: (user) =>
          [user.firstname, user.lastname].filter(Boolean).join(" "),
        meta: { label: t("dashboard.name") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.name")} />
        ),
        cell: ({ row }) => row.getValue<string>("name") || "—",
      },
      {
        accessorKey: "email",
        meta: { label: t("dashboard.email") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.email")} />
        ),
        cell: ({ row }) => row.getValue<string>("email") || "—",
      },
      {
        accessorKey: "phone",
        meta: { label: t("dashboard.phone") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.phone")} />
        ),
        cell: ({ row }) => {
          const phone = row.getValue<string>("phone")
          return phone ? formatPhoneNumberInternal(phone) : "—"
        },
      },
      {
        accessorKey: "telegramUsername",
        meta: { label: t("dashboard.telegramUsername") },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("dashboard.telegramUsername")}
          />
        ),
        cell: ({ row }) => {
          const username = row
            .getValue<string | null>("telegramUsername")
            ?.trim()
            .replace(/^@+/, "")
          return username ? `@${username}` : "—"
        },
      },
      {
        id: "roles",
        accessorFn: (user) => user.roles?.join(", ") ?? "",
        meta: { label: t("dashboard.roles") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.roles")} />
        ),
        cell: ({ row }) =>
          row.getValue<string>("roles") || t("dashboard.customer"),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <UserEditAction user={row.original} />
          </div>
        ),
      },
    ],
    [t]
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {" "}
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button>{t("dashboard.addUser")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dashboard.addUser")}</DialogTitle>
              <DialogDescription>
                {t("dashboard.addUserDescription")}
              </DialogDescription>
            </DialogHeader>
            <UserCreateForm
              organizationId={organizationId}
              showRoles
              onComplete={() => setCreateUserOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>{" "}
      {usersQuery.isLoading ? (
        <p className="text-muted-foreground">{t("dashboard.loadingUsers")}</p>
      ) : usersQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {t("dashboard.loadFailed")}
        </div>
      ) : (
        <DataTable
          columns={userColumns}
          data={users}
          searchColumn="name"
          searchPlaceholder={t("dashboard.search")}
          emptyMessage={t("dashboard.empty")}
        />
      )}
    </div>
  )
}
