"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import type { ProductListDTO } from "@/lib/api"
import { useGetAll4 } from "@/lib/api/generated/category/category"
import {
  getGetAll2QueryKey,
  useCreate2,
  useUpdate3,
} from "@/lib/api/generated/product/product"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  nameRu: z.string().trim(),
  nameEng: z.string().trim(),
  descriptionUz: z.string().trim(),
  descriptionRu: z.string().trim(),
  descriptionEng: z.string().trim(),
  categoryId: z.coerce.number().int().positive("Select a category."),
  basePrice: z.coerce.number().nonnegative("Price cannot be negative."),
  discountPercent: z.coerce.number().min(0).max(100),
  active: z.boolean(),
})

type ProductValues = z.infer<typeof productSchema>
type ProductInputs = z.input<typeof productSchema>

function productValues(product?: ProductListDTO): ProductInputs {
  return {
    name: product?.name ?? "",
    nameRu: product?.nameRu ?? "",
    nameEng: product?.nameEng ?? "",
    descriptionUz: "",
    descriptionRu: "",
    descriptionEng: "",
    categoryId: product?.categoryId ?? "",
    basePrice: product?.basePrice ?? 0,
    discountPercent: product?.discountPercent ?? 0,
    active: product?.active ?? true,
  }
}

export function ProductForm({
  organizationId,
  product,
  onComplete,
}: {
  organizationId: number
  product?: ProductListDTO
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const categoriesQuery = useGetAll4()
  const create = useCreate2()
  const update = useUpdate3()
  const form = useForm<ProductInputs, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productValues(product),
  })
  const editing = product?.id !== undefined

  useEffect(() => {
    form.reset(productValues(product))
  }, [form, product])

  const categories = (categoriesQuery.data ?? []).filter(
    (category) => category.organizationId === organizationId
  )

  async function submit(values: ProductValues) {
    const data = {
      name: values.name,
      ...(values.nameRu ? { nameRu: values.nameRu } : {}),
      ...(values.nameEng ? { nameEng: values.nameEng } : {}),
      ...(values.descriptionUz ? { descriptionUz: values.descriptionUz } : {}),
      ...(values.descriptionRu ? { descriptionRu: values.descriptionRu } : {}),
      ...(values.descriptionEng
        ? { descriptionEng: values.descriptionEng }
        : {}),
      categoryId: values.categoryId,
      organizationId,
      basePrice: values.basePrice,
      discountPercent: values.discountPercent,
      active: values.active,
    }

    try {
      if (editing && product.id !== undefined) {
        await update.mutateAsync({ id: product.id, data })
      } else {
        await create.mutateAsync({ data })
      }
      await queryClient.invalidateQueries({
        queryKey: getGetAll2QueryKey({ organizationId }),
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

  const pending = create.isPending || update.isPending

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <ProductField
        label={t("product.name")}
        error={form.formState.errors.name?.message}
      >
        <Input {...form.register("name")} />
      </ProductField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProductField
          label={t("product.nameRu")}
          error={form.formState.errors.nameRu?.message}
        >
          <Input {...form.register("nameRu")} />
        </ProductField>
        <ProductField
          label={t("product.nameEng")}
          error={form.formState.errors.nameEng?.message}
        >
          <Input {...form.register("nameEng")} />
        </ProductField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ProductField
          label={t("product.descriptionUz")}
          error={form.formState.errors.descriptionUz?.message}
        >
          <Input {...form.register("descriptionUz")} />
        </ProductField>
        <ProductField
          label={t("product.descriptionRu")}
          error={form.formState.errors.descriptionRu?.message}
        >
          <Input {...form.register("descriptionRu")} />
        </ProductField>
        <ProductField
          label={t("product.descriptionEng")}
          error={form.formState.errors.descriptionEng?.message}
        >
          <Input {...form.register("descriptionEng")} />
        </ProductField>
      </div>
      <ProductField
        label={t("product.category")}
        error={form.formState.errors.categoryId?.message}
      >
        <select
          className="h-10 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          {...form.register("categoryId")}
        >
          <option value="">{t("product.selectCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </ProductField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProductField
          label={t("product.basePrice")}
          error={form.formState.errors.basePrice?.message}
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            {...form.register("basePrice")}
          />
        </ProductField>
        <ProductField
          label={t("product.discountPercent")}
          error={form.formState.errors.discountPercent?.message}
        >
          <Input
            type="number"
            min="0"
            max="100"
            {...form.register("discountPercent")}
          />
        </ProductField>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4"
          {...form.register("active")}
        />
        {t("product.active")}
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || categoriesQuery.isLoading}>
          {editing ? t("product.save") : t("product.create")}
        </Button>
      </div>
    </form>
  )
}

function ProductField({
  children,
  error,
  label,
}: {
  children: React.ReactNode
  error?: string
  label: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  )
}
