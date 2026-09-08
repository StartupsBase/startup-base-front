"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { type ProductListDTO } from "@/lib/api"
import { useGetAll2 as useGetProducts } from "@/lib/api/generated/product/product"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"
import { ProductActions } from "./product-actions"
export function OrganizationProductsView({
  organizationId,
  language,
}: {
  organizationId: number
  language: string
}) {
  const { t } = useTranslation()
  const productsQuery = useGetProducts(
    { organizationId },
    { query: { retry: false } }
  )
  const products = productsQuery.data?.content ?? []

  const productColumns = useMemo<ColumnDef<ProductListDTO>[]>(
    () => [
      {
        accessorKey: "name",
        meta: { label: t("product.name") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.name")} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.mainImageUrl ? (
              <Avatar className="size-10 rounded-lg">
                <AvatarImage
                  src={row.original.mainImageUrl}
                  alt=""
                  className="rounded-lg"
                />
              </Avatar>
            ) : null}
            <span>{row.getValue<string>("name") || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "categoryName",
        meta: { label: t("product.category") },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("product.category")}
          />
        ),
        cell: ({ row }) => row.getValue<string>("categoryName") || "—",
      },
      {
        accessorKey: "branchName",
        meta: { label: t("product.branch") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.branch")} />
        ),
        cell: ({ row }) => row.getValue<string>("branchName") || "—",
      },
      {
        accessorKey: "basePrice",
        meta: { label: t("product.basePrice") },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("product.basePrice")}
          />
        ),
        cell: ({ row }) =>
          String(row.original.discountedPrice ?? row.original.basePrice ?? "—"),
      },
      {
        accessorKey: "amount",
        meta: { label: t("product.stock") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.stock")} />
        ),
        cell: ({ row }) => String(row.original.amount ?? 0),
      },
      {
        id: "status",
        accessorFn: (product) => String(product.active ?? true),
        meta: { label: t("product.status") },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.status")} />
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
              ? t("product.inactive")
              : t("product.active")}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <ProductActions
            product={row.original}
            organizationId={organizationId}
            language={language}
          />
        ),
      },
    ],
    [language, organizationId, t]
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {" "}
        <Button asChild>
          <Link
            href={`/${language}/dashboard/organizations/${organizationId}/products/new`}
          >
            {t("product.new")}
          </Link>
        </Button>
      </div>{" "}
      {productsQuery.isLoading ? (
        <p className="text-muted-foreground">{t("product.loading")}</p>
      ) : productsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {t("product.loadFailed")}
        </div>
      ) : (
        <DataTable
          columns={productColumns}
          data={products}
          searchColumn="name"
          searchPlaceholder={t("product.search")}
          emptyMessage={t("product.empty")}
        />
      )}
    </div>
  )
}
