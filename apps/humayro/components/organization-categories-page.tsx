"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { type CategoryDTO, useMe1 } from "@/lib/api"
import {
  getGetAll5QueryKey,
  useGetById5,
} from "@/lib/api/generated/admin-organization/admin-organization"
import {
  getGetAll4QueryKey,
  useCreate4,
  useDelete4,
  useGetAll4,
  useUpdate5,
} from "@/lib/api/generated/category/category"
import {
  useDelete7,
  useUpload,
} from "@/lib/api/generated/attachment-controller/attachment-controller"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
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

type CategoryFormValues = z.infer<typeof categorySchema>
type CategoryWithImageId = CategoryDTO & { imageId?: number }

const emptyCategory: CategoryFormValues = {
  name: "",
  description: "",
  sizeType: "LETTER",
  parentId: "",
  image: undefined,
  active: true,
}

function getCategoryValues(category?: CategoryDTO): CategoryFormValues {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    sizeType: category?.sizeType ?? "LETTER",
    parentId: category?.parentId?.toString() ?? "",
    image: undefined,
    active: category?.active ?? true,
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
  const organizationQuery = useGetById5(organizationId, {
    query: { retry: false },
  })
  const canManageCategories =
    meQuery.data?.roles?.some(
      (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
    ) ?? false
  const categoriesQuery = useGetAll4(undefined, {
    query: { enabled: canManageCategories, retry: false },
  })
  const [createOpen, setCreateOpen] = useState(false)

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

  if (meQuery.isLoading || !canManageCategories) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
      <Link
        href={`/${language}/dashboard/organizations`}
        className="text-sm font-medium text-primary hover:underline"
      >
        {t("category.backToOrganizations")}
      </Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <SidebarTrigger className="mb-3" />
          <p className="text-sm font-medium text-primary">
            {organizationQuery.data?.name ?? t("dashboard.organizations")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("category.title")}
          </h1>
        </div>
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
      </header>
      <section className="py-8">
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
      </section>
    </main>
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
      ...(values.description ? { description: values.description } : {}),
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
    onComplete()
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
  const removeAttachment = useDelete7()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function remove() {
    if (category.id === undefined) return
    setDeleteError(null)
    const imageAttachmentId = readImageAttachmentId(category)

    if (category.imageUrl && imageAttachmentId === undefined) {
      setDeleteError(t("category.imageReferenceMissing"))
      return
    }

    try {
      if (imageAttachmentId !== undefined) {
        await removeAttachment.mutateAsync({ id: imageAttachmentId })
      }
      await removeCategory.mutateAsync({ id: category.id })
      window.localStorage.removeItem(imageStorageKey(category.id))
      await queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
    } catch {
      setDeleteError(t("category.deleteFailed"))
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
