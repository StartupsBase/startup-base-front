"use client"

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  Trash,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
  useMove,
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
  useGetById2 as useGetProduct,
  useGetAll2 as useGetProducts,
} from "@/lib/api/generated/product/product"
import { clearAuthToken } from "@/lib/auth-client"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { UserCreateForm } from "../../../_components/user-create-form"
import { LocationPickerDialog } from "../../_components/maps/location-picker-dialog"
import { OrganizationForm } from "../../_components/organization-form"
import { DashboardBreadcrumb } from "../../../_components/dashboard-breadcrumb"
import { BulkCategoryForm } from "./bulk-category-form"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
import {
  SortableList,
  type SortableListMovement,
} from "@workspace/ui/components/sortable-list"

const ROOT_CATEGORY = "__root_category__"

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  nameRu: z.string().trim(),
  nameEng: z.string().trim(),
  descriptionUz: z.string().trim(),
  descriptionRu: z.string().trim(),
  descriptionEng: z.string().trim(),
  sizeType: z.enum(["LETTER", "NUMBER"]),
  parentId: z.string(),
  sortOrder: z.number().int().nonnegative(),
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
  nameRu: "",
  nameEng: "",
  descriptionUz: "",
  descriptionRu: "",
  descriptionEng: "",
  sizeType: "LETTER",
  parentId: "",
  sortOrder: 0,
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
    nameRu: category?.nameRu ?? "",
    nameEng: category?.nameEng ?? "",
    descriptionUz: category?.descriptionUz ?? "",
    descriptionRu: category?.descriptionRu ?? "",
    descriptionEng: category?.descriptionEng ?? "",
    sizeType: category?.sizeType ?? "LETTER",
    parentId: category?.parentId?.toString() ?? "",
    sortOrder: category?.sortOrder ?? 0,
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

function compareCategoryOrder(a: CategoryDTO, b: CategoryDTO) {
  return (
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    (a.name ?? "").localeCompare(b.name ?? "")
  )
}

function sameCategoryParent(first?: number, second?: number) {
  return (first ?? null) === (second ?? null)
}

function isCategoryDescendant(
  categories: CategoryDTO[],
  ancestorId: number,
  possibleDescendantId: number
) {
  const categoriesById = new Map(
    categories.flatMap((category) =>
      category.id === undefined ? [] : [[category.id, category] as const]
    )
  )
  const visited = new Set<number>()
  let current = categoriesById.get(possibleDescendantId)

  while (current?.parentId != null && !visited.has(current.parentId)) {
    if (current.parentId === ancestorId) return true
    visited.add(current.parentId)
    current = categoriesById.get(current.parentId)
  }

  return false
}

function reparentCategory(
  categories: CategoryDTO[],
  categoryId: number,
  destinationParentId: number | undefined,
  destinationIndex: number
) {
  const movedCategory = categories.find(
    (category) => category.id === categoryId
  )
  if (!movedCategory) return categories

  const sourceSiblings = categories
    .filter(
      (category) =>
        category.id !== categoryId &&
        sameCategoryParent(category.parentId, movedCategory.parentId)
    )
    .sort(compareCategoryOrder)
  const destinationSiblings = categories
    .filter(
      (category) =>
        category.id !== categoryId &&
        sameCategoryParent(category.parentId, destinationParentId)
    )
    .sort(compareCategoryOrder)
  const insertionIndex = Math.min(
    Math.max(destinationIndex, 0),
    destinationSiblings.length
  )
  destinationSiblings.splice(insertionIndex, 0, {
    ...movedCategory,
    parentId: destinationParentId,
  })

  const placements = new Map<
    number,
    { parentId: number | undefined; sortOrder: number }
  >()
  sourceSiblings.forEach((category, sortOrder) => {
    if (category.id !== undefined) {
      placements.set(category.id, {
        parentId: movedCategory.parentId,
        sortOrder,
      })
    }
  })
  destinationSiblings.forEach((category, sortOrder) => {
    if (category.id !== undefined) {
      placements.set(category.id, { parentId: destinationParentId, sortOrder })
    }
  })

  return categories
    .map((category) => {
      if (category.id === undefined) return category
      const placement = placements.get(category.id)
      return placement ? { ...category, ...placement } : category
    })
    .sort(compareCategoryOrder)
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
  const queryClient = useQueryClient()
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
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false)
  const [editOrganizationOpen, setEditOrganizationOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createBranchOpen, setCreateBranchOpen] = useState(false)
  const [orderedCategories, setOrderedCategories] = useState<CategoryDTO[]>([])
  const moveCategory = useMove()

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

  useEffect(() => {
    setOrderedCategories([...categories].sort(compareCategoryOrder))
  }, [categories])

  async function reorderCategorySiblings(
    items: CategoryDTO[],
    movement: SortableListMovement<CategoryDTO>
  ) {
    const movedCategory = movement.item
    if (movedCategory.id === undefined) return

    const previousCategories = orderedCategories
    const nextOrder = new Map(
      items.flatMap((item, index) =>
        item.id === undefined ? [] : [[item.id, index] as const]
      )
    )
    setOrderedCategories((current) =>
      current
        .map((item) =>
          item.id !== undefined && nextOrder.has(item.id)
            ? { ...item, sortOrder: nextOrder.get(item.id) }
            : item
        )
        .sort(compareCategoryOrder)
    )

    try {
      await moveCategory.mutateAsync({
        id: movedCategory.id,
        data: {
          ...(movedCategory.parentId != null
            ? { parentId: movedCategory.parentId }
            : {}),
          sortOrder: movement.toIndex,
        },
      })
      await queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      toast.success(t("category.orderSaved"))
    } catch {
      setOrderedCategories(previousCategories)
      void queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      toast.error(t("category.orderFailed"))
    }
  }

  async function moveCategoryToParent(
    category: CategoryDTO,
    parentId: number | undefined,
    sortOrder: number
  ) {
    if (category.id === undefined) return
    const categoryId = category.id

    if (
      parentId === categoryId ||
      (parentId !== undefined &&
        isCategoryDescendant(orderedCategories, categoryId, parentId))
    ) {
      toast.error(t("category.cannotMoveIntoDescendant"))
      return
    }
    if (sameCategoryParent(category.parentId, parentId)) return

    const previousCategories = orderedCategories
    const destinationCount = orderedCategories.filter(
      (item) =>
        item.id !== categoryId && sameCategoryParent(item.parentId, parentId)
    ).length
    const destinationOrder = Math.min(Math.max(sortOrder, 0), destinationCount)
    setOrderedCategories((current) =>
      reparentCategory(current, categoryId, parentId, destinationOrder)
    )

    try {
      await moveCategory.mutateAsync({
        id: categoryId,
        data: {
          ...(parentId !== undefined ? { parentId } : {}),
          sortOrder: destinationOrder,
        },
      })
      await queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      toast.success(t("category.moveSaved"))
    } catch {
      setOrderedCategories(previousCategories)
      void queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      toast.error(t("category.orderFailed"))
    }
  }
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
          return phone ? formatPhoneNumberInternal(phone) : "—"
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
            <div>
              <span className="font-medium">
                {row.getValue<string>("name") || "—"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {row.original.parentId
                  ? t("category.childCategory")
                  : t("category.rootCategory")}
              </span>
            </div>
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
        accessorKey: "productCount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("category.products")}
          />
        ),
        cell: ({ row }) => String(row.original.productCount ?? 0),
      },
      {
        accessorKey: "sortOrder",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("category.sortOrder")}
          />
        ),
        cell: ({ row }) => String(row.original.sortOrder ?? 0),
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
          return phone ? formatPhoneNumberInternal(phone) : "—"
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
        accessorKey: "branchName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.branch")} />
        ),
        cell: ({ row }) => row.getValue<string>("branchName") || "—",
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
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("product.stock")} />
        ),
        cell: ({ row }) => String(row.original.amount ?? 0),
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
            language={language}
          />
        ),
      },
    ],
    [language, organizationId, t]
  )

  if (meQuery.isLoading || !canManageCategories) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-primary">
                  {t("dashboard.organizations")}
                </p>
                {organizationQuery.data ? (
                  <>
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
                    <Dialog
                      open={editOrganizationOpen}
                      onOpenChange={setEditOrganizationOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full px-3"
                        >
                          <HugeiconsIcon
                            icon={PencilEdit02Icon}
                            className="size-4"
                          />
                          {t("organization.edit")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>{t("organization.edit")}</DialogTitle>
                          <DialogDescription>
                            {t("organization.editDescription")}
                          </DialogDescription>
                        </DialogHeader>
                        <OrganizationForm
                          organization={organizationQuery.data}
                          onComplete={() => setEditOrganizationOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </>
                ) : null}
              </div>
              <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">
                {organizationQuery.data?.name ??
                  t("organization.loadingDetails")}
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
            <div className="flex flex-wrap gap-2">
              <Dialog open={bulkCreateOpen} onOpenChange={setBulkCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <HugeiconsIcon icon={Add01Icon} />
                    {t("category.bulkNew")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
                  <DialogHeader>
                    <DialogTitle>{t("category.bulkTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("category.bulkDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <BulkCategoryForm
                    organizationId={organizationId}
                    categories={categories}
                    onComplete={() => setBulkCreateOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>{t("category.new")}</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
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
            </div>
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
          <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    ? formatPhoneNumberInternal(
                        organizationQuery.data.contactPhone
                      )
                    : undefined,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
            />
            <OrganizationInfo label="INN" value={organizationQuery.data.inn} />
            <OrganizationInfo
              label={t("organization.address")}
              value={organizationQuery.data.address}
            />
            <OrganizationInfo
              label={t("organization.latitude")}
              value={
                typeof organizationQuery.data.latitude === "number"
                  ? organizationQuery.data.latitude.toFixed(6)
                  : undefined
              }
            />
            <OrganizationInfo
              label={t("organization.longitude")}
              value={
                typeof organizationQuery.data.longitude === "number"
                  ? organizationQuery.data.longitude.toFixed(6)
                  : undefined
              }
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
            <CategoryHierarchyList
              categories={orderedCategories}
              disabled={moveCategory.isPending}
              onReorder={reorderCategorySiblings}
              onMoveToParent={moveCategoryToParent}
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

function CategoryHierarchyList({
  categories,
  disabled,
  onReorder,
  onMoveToParent,
}: {
  categories: CategoryDTO[]
  disabled: boolean
  onReorder: (
    items: CategoryDTO[],
    movement: SortableListMovement<CategoryDTO>
  ) => void | Promise<void>
  onMoveToParent: (
    category: CategoryDTO,
    parentId: number | undefined,
    sortOrder: number
  ) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const [draggedCategory, setDraggedCategory] = useState<CategoryDTO | null>(
    null
  )
  const [moveDialogCategory, setMoveDialogCategory] =
    useState<CategoryDTO | null>(null)
  const [destinationParent, setDestinationParent] = useState(ROOT_CATEGORY)
  const [destinationPosition, setDestinationPosition] = useState<
    "first" | "last"
  >("last")
  const roots = categories.filter((category) => category.parentId == null)

  function canUseCategoryAsParent(
    movingCategory: CategoryDTO,
    destinationCategory: CategoryDTO
  ) {
    if (movingCategory.id === undefined || destinationCategory.id === undefined)
      return false
    if (movingCategory.id === destinationCategory.id) return false
    return !isCategoryDescendant(
      categories,
      movingCategory.id,
      destinationCategory.id
    )
  }

  function canMoveInside(category: CategoryDTO) {
    return draggedCategory
      ? draggedCategory.parentId !== category.id &&
          canUseCategoryAsParent(draggedCategory, category)
      : false
  }

  function handlePointerDrop(category: CategoryDTO, target: Element | null) {
    const dropZone = target?.closest<HTMLElement>("[data-category-drop-parent]")
    const destination = dropZone?.dataset.categoryDropParent
    if (!destination) return false

    if (destination === "root") {
      if (category.parentId == null) return false
      void onMoveToParent(category, undefined, roots.length)
      setDraggedCategory(null)
      return true
    }

    const destinationId = Number(destination)
    const destinationCategory = categories.find(
      (item) => item.id === destinationId
    )
    if (
      !destinationCategory ||
      category.parentId === destinationCategory.id ||
      !canUseCategoryAsParent(category, destinationCategory)
    ) {
      return false
    }

    const destinationChildren = categories.filter(
      (item) => item.parentId === destinationId
    )
    void onMoveToParent(category, destinationId, destinationChildren.length)
    setDraggedCategory(null)
    return true
  }

  function reorderWithinSiblings(
    category: CategoryDTO,
    siblings: CategoryDTO[],
    targetIndex: number
  ) {
    const fromIndex = siblings.findIndex((item) => item.id === category.id)
    if (
      fromIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= siblings.length ||
      fromIndex === targetIndex
    ) {
      return
    }

    const reordered = [...siblings]
    const [moved] = reordered.splice(fromIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)
    void onReorder(reordered, {
      item: moved,
      fromIndex,
      toIndex: targetIndex,
    })
  }

  function openMoveDialog(category: CategoryDTO) {
    setMoveDialogCategory(category)
    setDestinationParent(
      category.parentId == null ? ROOT_CATEGORY : category.parentId.toString()
    )
    setDestinationPosition("last")
  }

  function categoryPath(category: CategoryDTO) {
    const path = [category.name || t("category.unnamed")]
    const visited = new Set<number>()
    let parentId = category.parentId

    while (parentId != null && !visited.has(parentId)) {
      visited.add(parentId)
      const parent = categories.find((item) => item.id === parentId)
      if (!parent) break
      path.unshift(parent.name || t("category.unnamed"))
      parentId = parent.parentId
    }

    return path.join(" / ")
  }

  function applyButtonMove() {
    if (!moveDialogCategory) return
    const parentId =
      destinationParent === ROOT_CATEGORY
        ? undefined
        : Number(destinationParent)
    const destinationSiblings = categories
      .filter(
        (item) =>
          sameCategoryParent(item.parentId, parentId) &&
          item.id !== moveDialogCategory.id
      )
      .sort(compareCategoryOrder)
    const targetIndex =
      destinationPosition === "first" ? 0 : destinationSiblings.length

    if (sameCategoryParent(moveDialogCategory.parentId, parentId)) {
      const currentSiblings = categories
        .filter((item) => sameCategoryParent(item.parentId, parentId))
        .sort(compareCategoryOrder)
      reorderWithinSiblings(
        moveDialogCategory,
        currentSiblings,
        destinationPosition === "first" ? 0 : currentSiblings.length - 1
      )
    } else {
      void onMoveToParent(moveDialogCategory, parentId, targetIndex)
    }
    setMoveDialogCategory(null)
  }

  function categoryRow(
    category: CategoryDTO,
    depth: number,
    siblingIndex: number,
    siblings: CategoryDTO[]
  ) {
    const children = categories.filter((item) => item.parentId === category.id)

    return (
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{category.name || "—"}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {depth === 0
                    ? t("category.rootCategory")
                    : t("category.childCategory")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("category.products")}: {category.productCount ?? 0} ·{" "}
                {t("category.sortOrder")}: {category.sortOrder ?? 0} ·{" "}
                {category.sizeType === "NUMBER"
                  ? t("category.number")
                  : t("category.letter")}
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-[2.75rem_2.75rem_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-11 sm:size-8"
              disabled={disabled || siblingIndex === 0}
              title={t("category.moveUp")}
              aria-label={t("category.moveUp")}
              onClick={() =>
                reorderWithinSiblings(category, siblings, siblingIndex - 1)
              }
            >
              <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-11 sm:size-8"
              disabled={disabled || siblingIndex === siblings.length - 1}
              title={t("category.moveDown")}
              aria-label={t("category.moveDown")}
              onClick={() =>
                reorderWithinSiblings(category, siblings, siblingIndex + 1)
              }
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 w-full px-3 sm:h-8 sm:w-auto"
              disabled={disabled}
              onClick={() => openMoveDialog(category)}
            >
              {t("category.moveCategory")}
            </Button>
            <div className="col-span-3 flex justify-end sm:col-auto">
              <CategoryActions category={category} categories={categories} />
            </div>
          </div>
        </div>

        {draggedCategory && canMoveInside(category) ? (
          <button
            type="button"
            data-category-drop-parent={category.id}
            className="mt-3 flex min-h-12 w-full touch-none items-center justify-center rounded-xl border border-dashed border-primary/60 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/15"
            onDragEnter={(event) => event.stopPropagation()}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              event.dataTransfer.dropEffect = "move"
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (category.id !== undefined) {
                void onMoveToParent(
                  draggedCategory,
                  category.id,
                  children.length
                )
              }
              setDraggedCategory(null)
            }}
          >
            {t("category.dropInside", {
              name: category.name || t("category.unnamed"),
            })}
          </button>
        ) : null}

        {children.length ? (
          <div className="mt-3 border-l-2 border-primary/20 pl-4">
            <SortableList
              items={children}
              getId={(item) => item.id ?? `child-${item.name}`}
              disabled={disabled}
              moveLabel={t("category.dragToReorder")}
              onDragStateChange={setDraggedCategory}
              onPointerDrop={handlePointerDrop}
              onReorder={onReorder}
              renderItem={(item, index) =>
                categoryRow(item, depth + 1, index, children)
              }
            />
          </div>
        ) : null}
      </div>
    )
  }

  if (!roots.length) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        {t("category.empty")}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("category.dragDescription")}
        </p>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {categories.length} {t("category.categoriesCount")}
        </span>
      </div>
      {draggedCategory && draggedCategory.parentId != null ? (
        <button
          type="button"
          data-category-drop-parent="root"
          className="mb-3 flex min-h-12 w-full touch-none items-center justify-center rounded-xl border border-dashed border-primary/60 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/15"
          onDragEnter={(event) => event.stopPropagation()}
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
            event.dataTransfer.dropEffect = "move"
          }}
          onDrop={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void onMoveToParent(draggedCategory, undefined, roots.length)
            setDraggedCategory(null)
          }}
        >
          {t("category.moveToRoot")}
        </button>
      ) : null}
      <SortableList
        items={roots}
        getId={(item) => item.id ?? `root-${item.name}`}
        disabled={disabled}
        moveLabel={t("category.dragToReorder")}
        onDragStateChange={setDraggedCategory}
        onPointerDrop={handlePointerDrop}
        onReorder={onReorder}
        renderItem={(item, index) => categoryRow(item, 0, index, roots)}
      />

      <Dialog
        open={moveDialogCategory !== null}
        onOpenChange={(open) => {
          if (!open) setMoveDialogCategory(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("category.moveCategoryTitle")}</DialogTitle>
            <DialogDescription>
              {t("category.moveCategoryDescription", {
                name: moveDialogCategory?.name || t("category.unnamed"),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("category.destinationParent")}
              </label>
              <Select
                value={destinationParent}
                onValueChange={setDestinationParent}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT_CATEGORY}>
                    {t("category.root")}
                  </SelectItem>
                  {categories
                    .filter(
                      (category) =>
                        moveDialogCategory &&
                        canUseCategoryAsParent(moveDialogCategory, category)
                    )
                    .sort((first, second) =>
                      categoryPath(first).localeCompare(categoryPath(second))
                    )
                    .map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id!.toString()}
                      >
                        {categoryPath(category)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("category.destinationPosition")}
              </label>
              <Select
                value={destinationPosition}
                onValueChange={(value) =>
                  setDestinationPosition(value as "first" | "last")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">
                    {t("category.positionFirst")}
                  </SelectItem>
                  <SelectItem value="last">
                    {t("category.positionLast")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveDialogCategory(null)}
            >
              {t("category.cancelMove")}
            </Button>
            <Button type="button" disabled={disabled} onClick={applyButtonMove}>
              {t("category.applyMove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrganizationInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium break-words">{value || "—"}</p>
    </div>
  )
}

function ProductActions({
  product,
  organizationId,
  language,
}: {
  product: ProductListDTO
  organizationId: number
  language: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeProduct = useDeleteProduct()

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
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end sm:gap-1">
      {product.id !== undefined ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title={t("product.previewProduct")}
            >
              <HugeiconsIcon icon={ViewIcon} className="size-4" />
              <span className="sr-only">{t("product.previewProduct")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[94vh] overflow-hidden p-0 sm:max-w-[96vw]">
            <DialogHeader className="border-b px-6 py-4 text-left">
              <DialogTitle>{t("product.previewProduct")}</DialogTitle>
              <DialogDescription>{product.name}</DialogDescription>
            </DialogHeader>
            <ProductDetailsPreview productId={product.id} language={language} />
          </DialogContent>
        </Dialog>
      ) : null}
      {product.id !== undefined ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
          title={t("product.edit")}
          aria-label={t("product.edit")}
        >
          <Link
            href={`/${language}/dashboard/organizations/${organizationId}/products/${product.id}/edit`}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("product.edit")}</span>
          </Link>
        </Button>
      ) : null}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-10 p-0 text-destructive hover:text-destructive lg:h-8 lg:w-auto lg:px-3"
            title={t("product.delete")}
            aria-label={t("product.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("product.delete")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("product.delete")}</DialogTitle>
            <DialogDescription>{t("product.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={removeProduct.isPending}
              onClick={remove}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              {t("product.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductDetailsPreview({
  productId,
  language,
}: {
  productId: number
  language: string
}) {
  const { t } = useTranslation()
  const productQuery = useGetProduct(productId)
  const product = productQuery.data

  if (productQuery.isLoading) {
    return <div className="m-6 h-[70vh] animate-pulse rounded-3xl bg-muted" />
  }
  if (!product) {
    return <p className="p-8 text-destructive">{t("product.loadFailed")}</p>
  }

  const images = (product.images ?? [])
    .sort((a, b) => Number(b.main) - Number(a.main))
    .flatMap((image) => (image.url ? [image.url] : []))
  const name =
    language === "ru"
      ? product.nameRu || product.name || product.nameEng
      : product.name || product.nameRu || product.nameEng
  const description =
    language === "ru"
      ? product.descriptionRu || product.descriptionUz || product.descriptionEng
      : product.descriptionUz || product.descriptionRu || product.descriptionEng
  const price = product.discountedPrice ?? product.basePrice
  const formatter = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ")

  return (
    <div className="h-[calc(94vh-82px)] overflow-y-auto bg-background p-6 lg:p-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {images.slice(0, 6).map((url) => (
              <div
                key={url}
                className="size-[68px] shrink-0 overflow-hidden rounded-xl border bg-muted"
              >
                <img src={url} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
          <div className="order-1 aspect-square overflow-hidden rounded-3xl border bg-muted sm:order-2">
            {images[0] ? (
              <img
                src={images[0]}
                alt={name ?? ""}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-7xl font-bold text-primary/20">
                {name?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
        </div>

        <section className="py-2">
          <div className="flex flex-wrap gap-2 text-sm font-medium text-primary">
            <span>{product.categoryName || "—"}</span>
            <span>·</span>
            <span>{product.branchName || "—"}</span>
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight">
            {name || "—"}
          </h2>
          <p className="mt-3 text-sm font-medium text-primary">
            ★ {product.ratingAvg?.toFixed(1) ?? "0.0"} ·{" "}
            {product.ratingCount ?? 0}
          </p>
          <div className="mt-7 flex items-baseline gap-3">
            <strong className="text-3xl">
              {price == null ? "—" : `${formatter.format(price)} so'm`}
            </strong>
            {(product.discountPercent ?? 0) > 0 ? (
              <span className="text-lg text-muted-foreground line-through">
                {`${formatter.format(product.basePrice ?? 0)} so'm`}
              </span>
            ) : null}
          </div>
          {description ? (
            <div
              className="prose prose-sm dark:prose-invert mt-8 max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : null}

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold">{t("product.variants")}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(product.variants ?? []).map((variant, index) => (
                <div
                  key={variant.id ?? index}
                  className="rounded-2xl border bg-muted/30 p-4"
                >
                  <p className="font-medium">
                    {[variant.colorName, variant.sizeValue]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>
                      {t("product.stock")}: {variant.stock ?? 0}
                    </span>
                    <span>
                      {`${formatter.format(variant.effectivePrice ?? variant.price ?? product.basePrice ?? 0)} so'm`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
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
      className="grid gap-7"
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
          <Button
            variant="outline"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("branch.edit")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("branch.edit")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
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
          <Button
            variant="destructive"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("branch.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("branch.delete")}</span>
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
  initialParentId,
  organizationId,
  onComplete,
}: {
  category?: CategoryDTO
  categories: CategoryDTO[]
  initialParentId?: number
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
    defaultValues: category
      ? getCategoryValues(category)
      : {
          ...emptyCategory,
          parentId: initialParentId?.toString() ?? "",
        },
  })
  const editing = category?.id !== undefined
  const selectedImage = form.watch("image")
  const imagePreviewUrl = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : undefined),
    [selectedImage]
  )
  const excludedParentIds = useMemo(() => {
    const excluded = new Set<number>()
    if (category?.id === undefined) return excluded
    excluded.add(category.id)
    let changed = true
    while (changed) {
      changed = false
      for (const item of categories) {
        if (
          item.id !== undefined &&
          item.parentId != null &&
          excluded.has(item.parentId) &&
          !excluded.has(item.id)
        ) {
          excluded.add(item.id)
          changed = true
        }
      }
    }
    return excluded
  }, [categories, category?.id])

  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    },
    [imagePreviewUrl]
  )

  async function submit(values: CategoryFormValues) {
    try {
      let imageId =
        editing && category ? readImageAttachmentId(category) : undefined
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
        ...(values.nameRu ? { nameRu: values.nameRu } : {}),
        ...(values.nameEng ? { nameEng: values.nameEng } : {}),
        ...(values.descriptionUz
          ? { descriptionUz: values.descriptionUz }
          : {}),
        ...(values.descriptionRu
          ? { descriptionRu: values.descriptionRu }
          : {}),
        ...(values.descriptionEng
          ? { descriptionEng: values.descriptionEng }
          : {}),
        sizeType: values.sizeType,
        organizationId,
        ...(values.parentId ? { parentId: Number(values.parentId) } : {}),
        ...(imageId !== undefined ? { imageId } : {}),
        sortOrder: values.sortOrder,
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
      <section className="grid gap-4 rounded-3xl border bg-card p-5">
        <div>
          <h3 className="text-lg font-semibold">{t("category.identity")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("category.identityDescription")}
          </p>
        </div>
        <CategoryField
          label={t("category.name")}
          error={form.formState.errors.name?.message}
        >
          <Input placeholder={t("category.name")} {...form.register("name")} />
        </CategoryField>
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryField label={t("category.nameRu")}>
            <Input {...form.register("nameRu")} />
          </CategoryField>
          <CategoryField label={t("category.nameEng")}>
            <Input {...form.register("nameEng")} />
          </CategoryField>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["descriptionUz", "descriptionRu", "descriptionEng"] as const).map(
            (field) => (
              <CategoryField key={field} label={t(`category.${field}`)}>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...form.register(field)}
                />
              </CategoryField>
            )
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border bg-card p-5">
        <div>
          <h3 className="text-lg font-semibold">{t("category.hierarchy")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("category.hierarchyDescription")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryField
            label={t("category.sizeType")}
            error={form.formState.errors.sizeType?.message}
          >
            <Controller
              control={form.control}
              name="sizeType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    ref={field.ref}
                    aria-label={t("category.sizeType")}
                    className="h-11 w-full rounded-xl bg-background"
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LETTER">
                      {t("category.letter")}
                    </SelectItem>
                    <SelectItem value="NUMBER">
                      {t("category.number")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </CategoryField>
          <CategoryField
            label={t("category.parent")}
            error={form.formState.errors.parentId?.message}
          >
            <Controller
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value || ROOT_CATEGORY}
                  onValueChange={(nextValue) =>
                    field.onChange(nextValue === ROOT_CATEGORY ? "" : nextValue)
                  }
                >
                  <SelectTrigger
                    ref={field.ref}
                    aria-label={t("category.parent")}
                    className="h-11 w-full rounded-xl bg-background"
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT_CATEGORY}>
                      {t("category.root")}
                    </SelectItem>
                    {categories
                      .filter(
                        (item) =>
                          item.id !== undefined &&
                          !excludedParentIds.has(item.id)
                      )
                      .map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.parentId ? `↳ ${item.parentName} / ` : ""}
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </CategoryField>
        </div>
        <CategoryField label={t("category.sortOrder")}>
          <Input
            type="number"
            min={0}
            {...form.register("sortOrder", { valueAsNumber: true })}
          />
        </CategoryField>
        <div className="rounded-2xl bg-muted/50 p-4 text-sm">
          <span className="text-muted-foreground">
            {t("category.willAppearUnder")}:{" "}
          </span>
          <strong>
            {categories.find(
              (item) => item.id === Number(form.watch("parentId"))
            )?.name ?? t("category.root")}
          </strong>
          <span className="text-muted-foreground"> → </span>
          <strong>{form.watch("name") || t("category.unnamed")}</strong>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="aspect-square overflow-hidden rounded-2xl border bg-muted">
          {imagePreviewUrl || category?.imageUrl ? (
            <img
              src={imagePreviewUrl ?? category?.imageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              {t("category.noImage")}
            </div>
          )}
        </div>
        <div className="self-center">
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
          <p className="mt-2 text-xs text-muted-foreground">
            {t("category.imageDescription")}
          </p>
        </div>
      </section>
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
  const [childOpen, setChildOpen] = useState(false)
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
    <div className="flex justify-end gap-1">
      {category.id !== undefined ? (
        <Dialog open={childOpen} onOpenChange={setChildOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 sm:size-9"
              title={t("category.addChild")}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              <span className="sr-only">{t("category.addChild")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
            <DialogHeader>
              <DialogTitle>{t("category.addChild")}</DialogTitle>
              <DialogDescription>
                {t("category.addChildDescription", { parent: category.name })}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              categories={categories}
              initialParentId={category.id}
              organizationId={category.organizationId ?? 0}
              onComplete={() => setChildOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-11 p-0 sm:size-9 lg:h-8 lg:w-auto lg:px-3"
            title={t("category.edit")}
            aria-label={t("category.edit")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("category.edit")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
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
          <Button
            variant="ghost"
            size="sm"
            className="size-11 p-0 text-destructive hover:text-destructive sm:size-9 lg:h-8 lg:w-auto lg:px-3"
            title={t("category.delete")}
            aria-label={t("category.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("category.delete")}</span>
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
