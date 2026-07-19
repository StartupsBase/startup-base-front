"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { formatPhoneNumberIntl } from "react-phone-number-input"

import {
  type BranchDTO,
  type CategoryDTO,
  type ProductListDTO,
  type UserDTO,
  useMe1,
} from "@/lib/api"
import { useGetAll7 } from "@/lib/api/generated/admin-user/admin-user"
import {
  getGetAll6QueryKey,
  useGetById6,
} from "@/lib/api/generated/admin-organization/admin-organization"
import {
  getGetAll4QueryKey,
  useCreate4,
  useDelete4,
  useGetAll4,
  useUpdate5,
} from "@/lib/api/generated/category/category"
import {
  useDelete8,
  useUpload,
} from "@/lib/api/generated/attachment-controller/attachment-controller"
import {
  getGetAll5QueryKey as getBranchesQueryKey,
  useCreate5 as useCreateBranch,
  useDelete5 as useDeleteBranch,
  useGetAll5 as useGetBranches,
  useUpdate6 as useUpdateBranch,
} from "@/lib/api/generated/branch/branch"
import {
  getGetAll2QueryKey as getProductsQueryKey,
  useDelete2 as useDeleteProduct,
  useGetAll2 as useGetProducts,
} from "@/lib/api/generated/product/product"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { UserCreateForm } from "../../../_components/user-create-form"
import { LocationPickerDialog } from "../../_components/maps/location-picker-dialog"
import { ProductForm } from "./product-form"
import { DashboardBreadcrumb } from "../../../_components/dashboard-breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  description: z.string().trim(),
  sizeType: z.enum(["LETTER", "NUMBER"]),
  parentId: z.string(),
  image: z.instanceof(File).optional(),
  active: z.boolean(),
})

const branchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required."),
  phone: z.string().trim(),
  address: z.string().trim(),
  active: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>
type BranchFormValues = z.infer<typeof branchSchema>
type CategoryWithImageId = CategoryDTO & { imageId?: number }

const emptyCategory: CategoryFormValues = {
  name: "",
  description: "",
  sizeType: "LETTER",
  parentId: "",
  image: undefined,
  active: true,
}

const emptyBranch: BranchFormValues = {
  name: "",
  phone: "",
  address: "",
  active: true,
}

function getCategoryValues(category?: CategoryDTO): CategoryFormValues {
  return {
    name: category?.name ?? "",
    description: category?.descriptionUz ?? "",
    sizeType: category?.sizeType ?? "LETTER",
    parentId: category?.parentId?.toString() ?? "",
    image: undefined,
    active: category?.active ?? true,
  }
}

function getBranchValues(branch?: BranchDTO): BranchFormValues {
  return {
    name: branch?.name ?? "",
    phone: branch?.phone ?? "",
    address: branch?.address ?? "",
    active: branch?.active ?? true,
  }
}

function imageStorageKey(categoryId: number) {
  return `humayro:category-image:${categoryId}`
}

function readImageAttachmentId(category: CategoryDTO) {
  const apiImageId = (category as CategoryWithImageId).imageId
  if (typeof apiImageId === "number") return apiImageId
  if (category.id === undefined) return undefined

  const savedImageId = window.localStorage.getItem(imageStorageKey(category.id))
  const imageId = savedImageId ? Number(savedImageId) : undefined
  return Number.isSafeInteger(imageId) ? imageId : undefined
}

export function OrganizationCategoriesPage({
  language,
  organizationId,
}: {
  language: string
  organizationId: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const organizationQuery = useGetById6(organizationId, {
    query: { retry: false },
  })
  const canManageCategories =
    meQuery.data?.roles?.some(
      (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
    ) ?? false
  const categoriesQuery = useGetAll4(undefined, {
    query: { enabled: canManageCategories, retry: false },
  })
  const usersQuery = useGetAll7(
    { organizationId },
    {
      query: { enabled: canManageCategories, retry: false },
    }
  )
  const branchesQuery = useGetBranches(
    { organizationId },
    {
      query: { enabled: canManageCategories, retry: false },
    }
  )
  const productsQuery = useGetProducts(
    { organizationId },
    { query: { enabled: canManageCategories, retry: false } }
  )
  const [activeTab, setActiveTab] = useState<
    "users" | "categories" | "branches" | "products"
  >("users")
  const [createOpen, setCreateOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createBranchOpen, setCreateBranchOpen] = useState(false)

  useEffect(() => {
    if (!meQuery.isError) return
    clearAuthToken()
    clearUser()
    router.replace(`/${language}/login`)
  }, [clearUser, language, meQuery.isError, router])

  useEffect(() => {
    if (meQuery.isSuccess && !canManageCategories) {
      router.replace(`/${language}/dashboard`)
    }
  }, [canManageCategories, language, meQuery.isSuccess, router])

  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => category.organizationId === organizationId
      ),
    [categoriesQuery.data, organizationId]
  )
  const users = useMemo(
    () =>
      (usersQuery.data?.content ?? []).filter(
        (user) => user.organizationId === organizationId
      ),
    [organizationId, usersQuery.data]
  )
  const branches = branchesQuery.data?.content ?? []
  const products = productsQuery.data?.content ?? []
  const userColumns = useMemo<ColumnDef<UserDTO>[]>(
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
        cell: ({ row }) => {
          const phone = row.getValue<string>("phone")
          return phone ? formatPhoneNumberIntl(phone) || phone : "—"
        },
      },
      {
        id: "roles",
        accessorFn: (user) => user.roles?.join(", ") ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.roles")} />
        ),
        cell: ({ row }) =>
          row.getValue<string>("roles") || t("dashboard.customer"),
      },
    ],
    [t]
  )
  const columns = useMemo<ColumnDef<CategoryDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("category.name")} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.imageUrl ? (
              <img
                src={row.original.imageUrl}
                alt=""
                className="size-10 rounded-lg object-cover"
              />
            ) : null}
            <span>{row.getValue<string>("name") || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "sizeType",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("category.sizeType")}
          />
        ),
        cell: ({ row }) =>
          row.getValue<string>("sizeType") === "NUMBER"
            ? t("category.number")
            : t("category.letter"),
      },
      {
        accessorKey: "parentName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("category.parent")} />
        ),
        cell: ({ row }) =>
          row.getValue<string>("parentName") || t("category.root"),
      },
      {
        id: "status",
        accessorFn: (category) => String(category.active ?? true),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("category.status")} />
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
              ? t("category.inactive")
              : t("category.active")}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <CategoryActions category={row.original} categories={categories} />
        ),
      },
    ],
    [categories, t]
  )
  const branchColumns = useMemo<ColumnDef<BranchDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.name")} />
        ),
        cell: ({ row }) => row.getValue<string>("name") || "—",
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.phone")} />
        ),
        cell: ({ row }) => {
          const phone = row.getValue<string>("phone")
          return phone ? formatPhoneNumberIntl(phone) || phone : "—"
        },
      },
      {
        accessorKey: "address",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("branch.address")} />
        ),
        cell: ({ row }) => row.getValue<string>("address") || "—",
      },
      {
        id: "status",
        accessorFn: (branch) => String(branch.active ?? true),
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
  const productColumns = useMemo<ColumnDef<ProductListDTO>[]>(
    () => [
      {
        accessorKey: "name",
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
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("product.category")}
          />
        ),
        cell: ({ row }) => row.getValue<string>("categoryName") || "—",
      },
      {
        accessorKey: "basePrice",
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
        accessorKey: "totalStock",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.stock")} />
        ),
        cell: ({ row }) => String(row.original.totalStock ?? 0),
      },
      {
        id: "status",
        accessorFn: (product) => String(product.active ?? true),
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
          />
        ),
      },
    ],
    [organizationId, t]
  )

  if (meQuery.isLoading || !canManageCategories) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
      <DashboardBreadcrumb
        language={language}
        items={[
          {
            href: `/${language}/dashboard/organizations`,
            label: t("dashboard.organizations"),
          },
          {
            label:
              organizationQuery.data?.name ?? t("organization.loadingDetails"),
          },
        ]}
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(
            value as "users" | "categories" | "branches" | "products"
          )
        }
      >
        <header className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-5 shadow-sm md:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted text-2xl font-semibold text-muted-foreground md:size-24">
              {organizationQuery.data?.logo?.s3Url ? (
                <img
                  src={organizationQuery.data.logo.s3Url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                (organizationQuery.data?.name ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <SidebarTrigger className="mb-2" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-primary">
                  {t("dashboard.organizations")}
                </p>
                {organizationQuery.data ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      organizationQuery.data.active === false
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {organizationQuery.data.active === false
                      ? t("organization.inactive")
                      : t("organization.active")}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">
                {organizationQuery.data?.name ?? t("organization.loadingDetails")}
              </h1>
              {organizationQuery.data?.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {organizationQuery.data.description}
                </p>
              ) : null}
            </div>
          </div>
          {activeTab === "users" ? (
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
                  onComplete={() => setCreateUserOpen(false)}
                />
              </DialogContent>
            </Dialog>
          ) : activeTab === "categories" ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>{t("category.new")}</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{t("category.new")}</DialogTitle>
                  <DialogDescription>
                    {t("category.createDescription")}
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm
                  organizationId={organizationId}
                  categories={categories}
                  onComplete={() => setCreateOpen(false)}
                />
              </DialogContent>
            </Dialog>
          ) : activeTab === "branches" ? (
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
          ) : (
            <Button asChild>
              <Link
                href={`/${language}/dashboard/organizations/${organizationId}/products/new`}
              >
                {t("product.new")}
              </Link>
            </Button>
          )}
        </header>
        {organizationQuery.data ? (
          <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OrganizationInfo
              label={t("organization.contactPerson")}
              value={organizationQuery.data.contactPerson}
            />
            <OrganizationInfo
              label={t("organization.contact")}
              value={
                [
                  organizationQuery.data.contactEmail,
                  organizationQuery.data.contactPhone
                    ? formatPhoneNumberIntl(organizationQuery.data.contactPhone) ||
                      organizationQuery.data.contactPhone
                    : undefined,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
            />
            <OrganizationInfo
              label="INN"
              value={organizationQuery.data.inn}
            />
            <OrganizationInfo
              label={t("organization.address")}
              value={organizationQuery.data.address}
            />
          </section>
        ) : null}
        <TabsList className="mt-6">
          <TabsTrigger value="users">{t("organization.users")}</TabsTrigger>
          <TabsTrigger value="categories">
            {t("organization.categories")}
          </TabsTrigger>
          <TabsTrigger value="branches">
            {t("organization.branches")}
          </TabsTrigger>
          <TabsTrigger value="products">
            {t("organization.products")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="py-8">
          {usersQuery.isLoading || organizationQuery.isLoading ? (
            <p className="text-muted-foreground">
              {t("dashboard.loadingUsers")}
            </p>
          ) : usersQuery.isError || organizationQuery.isError ? (
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
        </TabsContent>
        <TabsContent value="categories" className="py-8">
          {categoriesQuery.isLoading || organizationQuery.isLoading ? (
            <p className="text-muted-foreground">{t("category.loading")}</p>
          ) : categoriesQuery.isError || organizationQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
              {t("category.loadFailed")}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={categories}
              searchColumn="name"
              searchPlaceholder={t("category.search")}
              emptyMessage={t("category.empty")}
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
        </TabsContent>
        <TabsContent value="branches" className="py-8">
          {branchesQuery.isLoading || organizationQuery.isLoading ? (
            <p className="text-muted-foreground">{t("branch.loading")}</p>
          ) : branchesQuery.isError || organizationQuery.isError ? (
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
        </TabsContent>
        <TabsContent value="products" className="py-8">
          {productsQuery.isLoading || organizationQuery.isLoading ? (
            <p className="text-muted-foreground">{t("product.loading")}</p>
          ) : productsQuery.isError || organizationQuery.isError ? (
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
        </TabsContent>
      </Tabs>
    </main>
  )
}

function OrganizationInfo({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

function ProductActions({
  product,
  organizationId,
}: {
  product: ProductListDTO
  organizationId: number
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeProduct = useDeleteProduct()
  const [editOpen, setEditOpen] = useState(false)

  async function remove() {
    if (product.id === undefined) return
    try {
      await removeProduct.mutateAsync({ id: product.id })
      await queryClient.invalidateQueries({
        queryKey: getProductsQueryKey({ organizationId }),
      })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("product.edit")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("product.edit")}</DialogTitle>
            <DialogDescription>{product.name}</DialogDescription>
          </DialogHeader>
          <ProductForm
            organizationId={organizationId}
            product={product}
            onComplete={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="destructive" size="sm">
            {t("product.delete")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-64 gap-3">
          <p className="text-sm">{t("product.deleteConfirm")}</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={removeProduct.isPending}
            onClick={remove}
          >
            {t("product.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function BranchForm({
  branch,
  organizationId,
  onComplete,
}: {
  branch?: BranchDTO
  organizationId: number
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreateBranch()
  const update = useUpdateBranch()
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch ? getBranchValues(branch) : emptyBranch,
  })
  const editing = branch?.id !== undefined

  async function submit(values: BranchFormValues) {
    const data = {
      name: values.name,
      organizationId,
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.address ? { address: values.address } : {}),
    }

    try {
      if (editing && branch.id !== undefined) {
        await update.mutateAsync({
          id: branch.id,
          data: { ...data, active: values.active },
        })
      } else {
        await create.mutateAsync({ data })
      }
      await queryClient.invalidateQueries({
        queryKey: getBranchesQueryKey({ organizationId }),
      })
      toast.success(
        t(
          editing
            ? "notifications.updateSuccess"
            : "notifications.createSuccess"
        )
      )
      onComplete()
    } catch {
      toast.error(
        t(editing ? "notifications.updateFailed" : "notifications.createFailed")
      )
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <CategoryField
        label={t("branch.name")}
        error={form.formState.errors.name?.message}
      >
        <Input placeholder={t("branch.name")} {...form.register("name")} />
      </CategoryField>
      <CategoryField
        label={t("branch.phone")}
        error={form.formState.errors.phone?.message}
      >
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput value={field.value} onChange={field.onChange} />
          )}
        />
      </CategoryField>
      <CategoryField
        label={t("branch.address")}
        error={form.formState.errors.address?.message}
      >
        <div className="flex gap-2">
          <Input
            placeholder={t("branch.address")}
            {...form.register("address")}
          />
          <LocationPickerDialog
            onSelect={(address) =>
              form.setValue("address", address, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </CategoryField>
      {editing ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4"
            {...form.register("active")}
          />
          {t("branch.active")}
        </label>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {editing ? t("branch.save") : t("branch.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function BranchActions({
  branch,
  organizationId,
}: {
  branch: BranchDTO
  organizationId: number
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeBranch = useDeleteBranch()
  const [editOpen, setEditOpen] = useState(false)

  async function remove() {
    if (branch.id === undefined) return
    try {
      await removeBranch.mutateAsync({ id: branch.id })
      await queryClient.invalidateQueries({
        queryKey: getBranchesQueryKey({ organizationId }),
      })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("branch.edit")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("branch.edit")}</DialogTitle>
            <DialogDescription>{branch.name}</DialogDescription>
          </DialogHeader>
          <BranchForm
            branch={branch}
            organizationId={organizationId}
            onComplete={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="destructive" size="sm">
            {t("branch.delete")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-64 gap-3">
          <p className="text-sm">{t("branch.deleteConfirm")}</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={removeBranch.isPending}
            onClick={remove}
          >
            {t("branch.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function CategoryForm({
  category,
  categories,
  organizationId,
  onComplete,
}: {
  category?: CategoryDTO
  categories: CategoryDTO[]
  organizationId: number
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreate4()
  const update = useUpdate5()
  const upload = useUpload()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? getCategoryValues(category) : emptyCategory,
  })
  const editing = category?.id !== undefined

  async function submit(values: CategoryFormValues) {
    try {
      let imageId: number | undefined
      if (values.image) {
        const attachment = await upload.mutateAsync({
          data: { file: values.image },
        })
        if (attachment.id === undefined)
          throw new Error("Image upload did not return an attachment ID.")
        imageId = attachment.id
      }

      const data = {
        name: values.name,
        ...(values.description ? { descriptionUz: values.description } : {}),
        sizeType: values.sizeType,
        organizationId,
        ...(values.parentId ? { parentId: Number(values.parentId) } : {}),
        ...(imageId !== undefined ? { imageId } : {}),
      }

      const savedCategory =
        editing && category.id !== undefined
          ? await update.mutateAsync({
              id: category.id,
              data: { ...data, active: values.active },
            })
          : await create.mutateAsync({ data })

      if (imageId !== undefined && savedCategory.id !== undefined) {
        window.localStorage.setItem(
          imageStorageKey(savedCategory.id),
          String(imageId)
        )
      }
      await queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      toast.success(
        t(
          editing
            ? "notifications.updateSuccess"
            : "notifications.createSuccess"
        )
      )
      onComplete()
    } catch {
      toast.error(
        t(editing ? "notifications.updateFailed" : "notifications.createFailed")
      )
    }
  }

  const pending = create.isPending || update.isPending || upload.isPending

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <CategoryField
        label={t("category.name")}
        error={form.formState.errors.name?.message}
      >
        <Input placeholder={t("category.name")} {...form.register("name")} />
      </CategoryField>
      <CategoryField
        label={t("category.description")}
        error={form.formState.errors.description?.message}
      >
        <Input
          placeholder={t("category.description")}
          {...form.register("description")}
        />
      </CategoryField>
      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryField
          label={t("category.sizeType")}
          error={form.formState.errors.sizeType?.message}
        >
          <select
            className="h-10 rounded-4xl border border-input bg-input/30 px-3 text-sm"
            {...form.register("sizeType")}
          >
            <option value="LETTER">{t("category.letter")}</option>
            <option value="NUMBER">{t("category.number")}</option>
          </select>
        </CategoryField>
        <CategoryField
          label={t("category.parent")}
          error={form.formState.errors.parentId?.message}
        >
          <select
            className="h-10 rounded-4xl border border-input bg-input/30 px-3 text-sm"
            {...form.register("parentId")}
          >
            <option value="">{t("category.root")}</option>
            {categories
              .filter((item) => item.id !== category?.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </CategoryField>
      </div>
      <CategoryField
        label={t("category.image")}
        error={form.formState.errors.image?.message}
      >
        <Input
          type="file"
          accept="image/*"
          onChange={(event) =>
            form.setValue("image", event.target.files?.[0], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </CategoryField>
      {editing ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4"
            {...form.register("active")}
          />
          {t("category.active")}
        </label>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {editing ? t("category.save") : t("category.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function CategoryField({
  children,
  error,
  label,
}: {
  children: ReactNode
  error?: string
  label: string
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function CategoryActions({
  category,
  categories,
}: {
  category: CategoryDTO
  categories: CategoryDTO[]
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeCategory = useDelete4()
  const removeAttachment = useDelete8()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function remove() {
    if (category.id === undefined) return
    setDeleteError(null)
    const imageAttachmentId = readImageAttachmentId(category)

    if (category.imageUrl && imageAttachmentId === undefined) {
      setDeleteError(t("category.imageReferenceMissing"))
      toast.error(t("notifications.deleteFailed"))
      return
    }

    try {
      if (imageAttachmentId !== undefined) {
        await removeAttachment.mutateAsync({ id: imageAttachmentId })
      }
      await removeCategory.mutateAsync({ id: category.id })
      window.localStorage.removeItem(imageStorageKey(category.id))
      await queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      await queryClient.invalidateQueries({ queryKey: getGetAll6QueryKey() })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      setDeleteError(t("category.deleteFailed"))
      toast.error(t("notifications.deleteFailed"))
    }
  }

  const pending = removeCategory.isPending || removeAttachment.isPending

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("category.edit")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("category.edit")}</DialogTitle>
            <DialogDescription>{category.name}</DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={category}
            categories={categories}
            organizationId={category.organizationId ?? 0}
            onComplete={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="destructive" size="sm">
            {t("category.delete")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-72 gap-3">
          <p className="text-sm">{t("category.deleteConfirm")}</p>
          {deleteError ? (
            <p className="text-xs text-destructive">{deleteError}</p>
          ) : null}
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={remove}
          >
            {t("category.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
