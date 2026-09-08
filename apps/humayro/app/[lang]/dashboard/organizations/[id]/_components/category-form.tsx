"use client"

import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { type CategoryDTO } from "@/lib/api"
import {
  getGetAll5QueryKey,
  useCreate5,
  useUpdate5,
} from "@/lib/api/generated/category/category"
import { useUpload } from "@/lib/api/generated/attachment-controller/attachment-controller"
import { Button } from "@workspace/ui/components/button"
import { DialogFooter } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { CategoryField } from "./category-field"
import {
  ROOT_CATEGORY,
  imageStorageKey,
  readImageAttachmentId,
} from "./category-helpers"
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

type CategoryFormValues = z.infer<typeof categorySchema>
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

export function CategoryForm({
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
  const create = useCreate5()
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
      await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
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
                <Select
                  noOptions={t("select.noSizeTypes")}
                  value={field.value}
                  onValueChange={field.onChange}
                >
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
                  empty={
                    !categories.some(
                      (item) =>
                        item.id !== undefined && !excludedParentIds.has(item.id)
                    )
                  }
                  noOptions={t("select.noCategories")}
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
