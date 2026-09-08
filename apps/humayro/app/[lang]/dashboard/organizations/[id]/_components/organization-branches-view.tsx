"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { type BranchDTO } from "@/lib/api"
import { useInfiniteBranches } from "@/hooks/use-infinite-directory-query"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
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
import { BranchForm } from "./branch-form"
import { BranchActions } from "./branch-actions"
export function OrganizationBranchesView({
  organizationId,
}: {
  organizationId: number
}) {
  const { t } = useTranslation()
  const branchesQuery = useInfiniteBranches(
    { organizationId },
    { query: { retry: false } }
  )
  const branches = branchesQuery.data?.content ?? []
  const [createBranchOpen, setCreateBranchOpen] = useState(false)
  const branchColumns = useMemo<ColumnDef<BranchDTO>[]>(
    () => [
      {
        accessorKey: "name",
        meta: { label: t("branch.name") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.name")} />
        ),
        cell: ({ row }) => row.getValue<string>("name") || "—",
      },
      {
        accessorKey: "phone",
        meta: { label: t("branch.phone") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.phone")} />
        ),
        cell: ({ row }) => {
          const phone = row.getValue<string>("phone")
          return phone ? formatPhoneNumberInternal(phone) : "—"
        },
      },
      {
        accessorKey: "address",
        meta: { label: t("branch.address") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.address")} />
        ),
        cell: ({ row }) => row.getValue<string>("address") || "—",
      },
      {
        id: "status",
        accessorFn: (branch) => String(branch.active ?? true),
        meta: { label: t("branch.status") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.status")} />
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
              ? t("branch.inactive")
              : t("branch.active")}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <BranchActions
            branch={row.original}
            organizationId={organizationId}
          />
        ),
      },
    ],
    [organizationId, t]
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {" "}
        <Dialog open={createBranchOpen} onOpenChange={setCreateBranchOpen}>
          <DialogTrigger asChild>
            <Button>{t("branch.new")}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("branch.new")}</DialogTitle>
              <DialogDescription>
                {t("branch.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <BranchForm
              organizationId={organizationId}
              onComplete={() => setCreateBranchOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>{" "}
      {branchesQuery.isLoading ? (
        <p className="text-muted-foreground">{t("branch.loading")}</p>
      ) : branchesQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {t("branch.loadFailed")}
        </div>
      ) : (
        <DataTable
          columns={branchColumns}
          data={branches}
          searchColumn="name"
          searchPlaceholder={t("branch.search")}
          emptyMessage={t("branch.empty")}
        />
      )}
    </div>
  )
}
