"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  ImageAdd01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type {
  CategoryDTO,
  ProductDTO,
  ProductImageCreateDTO,
  ProductVariantCreateDTO,
} from "@/lib/api"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  useUploadImages,
  useUploadVideo,
} from "@/lib/api/generated/attachment-controller/attachment-controller"
import { useGetAll5 } from "@/lib/api/generated/category/category"
import { useInfiniteBranches } from "@/hooks/use-infinite-directory-query"
import { useGetAll4 as useGetColors } from "@/lib/api/generated/color/color"
import {
  getGetAll2QueryKey,
  useCreate2,
  useGetById2,
  useUpdate3,
} from "@/lib/api/generated/product/product"
import { useGetAll1 as useGetSizes } from "@/lib/api/generated/size/size"
import { ProductCreationProblemDialog } from "./product-creation-problem-dialog"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@workspace/ui/components/attachment"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { VideoPlayer } from "@workspace/ui/components/video-player"
import { cn } from "@workspace/ui/lib/utils"

const MAX_VIDEO_SIZE = 5 * 1024 * 1024

type Translation = ReturnType<typeof useTranslation>["t"]

function createProductSchema(t: Translation) {
  return z.object({
    name: z.string().trim().min(1, t("product.validation.nameRequired")),
    nameRu: z.string().trim(),
    descriptionUz: z.string().trim(),
    descriptionRu: z.string().trim(),
    categoryId: z.coerce
      .number({ error: t("product.validation.categoryRequired") })
      .int(t("product.validation.categoryRequired"))
      .positive(t("product.validation.categoryRequired")),
    branchId: z.coerce
      .number({ error: t("product.validation.branchRequired") })
      .int(t("product.validation.branchRequired"))
      .positive(t("product.validation.branchRequired")),
    basePrice: z.coerce
      .number({ error: t("product.validation.priceInvalid") })
      .nonnegative(t("product.validation.priceNonNegative")),
    amount: z.coerce
      .number({ error: t("product.validation.amountInvalid") })
      .int(t("product.validation.amountInteger"))
      .nonnegative(t("product.validation.amountNonNegative")),
    discountPercent: z.coerce
      .number({ error: t("product.validation.discountInvalid") })
      .min(0, t("product.validation.discountRange"))
      .max(100, t("product.validation.discountRange")),
    active: z.boolean(),
  })
}

type ProductSchema = ReturnType<typeof createProductSchema>
type ProductValues = z.infer<ProductSchema>
type ProductInputs = z.input<ProductSchema>

type ProductImage = ProductImageCreateDTO & {
  name: string
  url?: string
}

type ProductVariant = {
  id?: number
  colorId: string
  sizeId: string
  stock: string
  price: string
  active: boolean
}

const steps = ["basic", "media", "variants", "review"] as const
const basicFields = [
  "name",
  "nameRu",
  "descriptionUz",
  "descriptionRu",
  "categoryId",
  "branchId",
  "basePrice",
  "amount",
  "discountPercent",
  "active",
] as const

const PRICE_SUFFIX = "UZS"

function sanitizePriceInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "")
  const [whole = "", ...decimals] = normalized.split(".")
  const decimal = decimals.join("").slice(0, 2)
  return decimals.length > 0 ? `${whole}.${decimal}` : whole
}

function formatPriceInput(value: string | number | undefined) {
  const raw =
    typeof value === "number"
      ? value.toLocaleString("en-US", {
          useGrouping: false,
          maximumFractionDigits: 20,
        })
      : String(value ?? "")
  if (!raw) return ""
  const [whole = "0", decimal] = raw.split(".")
  const normalizedWhole = (whole || "0").replace(/^0+(?=\d)/, "")
  const formattedWhole = normalizedWhole.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "\u00a0"
  )
  return decimal === undefined ? formattedWhole : `${formattedWhole}.${decimal}`
}

function formatPrice(value: number) {
  return value.toLocaleString("uz-UZ", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
}

function getCategoryOptions(categories: CategoryDTO[]) {
  const selectable = categories.filter(
    (category): category is CategoryDTO & { id: number } =>
      category.id !== undefined
  )
  const ids = new Set(selectable.map((category) => category.id))
  const visited = new Set<number>()
  const result: Array<{
    category: CategoryDTO & { id: number }
    depth: number
    label: string
  }> = []
  const sortCategories = (
    left: CategoryDTO & { id: number },
    right: CategoryDTO & { id: number }
  ) =>
    (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
    (left.name ?? "").localeCompare(right.name ?? "")

  function visit(
    category: CategoryDTO & { id: number },
    ancestors: string[],
    depth: number
  ) {
    if (visited.has(category.id)) return
    visited.add(category.id)
    const name = category.name || "—"
    const path = [...ancestors, name]
    result.push({ category, depth, label: path.join(" / ") })
    selectable
      .filter((item) => item.parentId === category.id)
      .sort(sortCategories)
      .forEach((child) => visit(child, path, depth + 1))
  }

  selectable
    .filter(
      (category) => category.parentId == null || !ids.has(category.parentId)
    )
    .sort(sortCategories)
    .forEach((category) => visit(category, [], 0))
  selectable
    .filter((category) => !visited.has(category.id))
    .sort(sortCategories)
    .forEach((category) => visit(category, [], 0))

  return result
}

function productValues(product?: ProductDTO): ProductInputs {
  return {
    name: product?.name ?? "",
    nameRu: product?.nameRu ?? "",
    descriptionUz: product?.descriptionUz ?? "",
    descriptionRu: product?.descriptionRu ?? "",
    categoryId: product?.categoryId ?? "",
    branchId: product?.branchId ?? "",
    basePrice: product?.basePrice ?? 0,
    amount: product?.amount ?? 0,
    discountPercent: product?.discountPercent ?? 0,
    active: product?.active ?? true,
  }
}

function productImages(product?: ProductDTO): ProductImage[] {
  return (product?.images ?? []).flatMap((image, index) =>
    image.attachmentId === undefined
      ? []
      : [
          {
            id: image.id,
            attachmentId: image.attachmentId,
            main: image.main ?? index === 0,
            sortOrder: image.sortOrder ?? index,
            name: `Image ${index + 1}`,
            url: image.url,
          },
        ]
  )
}

function productVariants(product?: ProductDTO): ProductVariant[] {
  return (product?.variants ?? []).map((variant) => ({
    id: variant.id,
    colorId: variant.colorId?.toString() ?? "",
    sizeId: variant.sizeId?.toString() ?? "",
    stock: variant.stock?.toString() ?? "0",
    price: variant.price?.toString() ?? "",
    active: variant.active ?? true,
  }))
}

export function ProductForm({
  onCancel,
  organizationId,
  productId,
  onComplete,
}: {
  onCancel?: () => void
  organizationId: number
  productId?: number
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const editing = productId !== undefined
  const detailsQuery = useGetById2(productId ?? 0, {
    query: { enabled: editing, retry: false },
  })
  const categoriesQuery = useGetAll5()
  const branchesQuery = useInfiniteBranches({ organizationId, size: 100 })
  const colorsQuery = useGetColors()
  const sizesQuery = useGetSizes()
  const create = useCreate2()
  const update = useUpdate3()
  const uploadImages = useUploadImages()
  const uploadVideo = useUploadVideo()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [images, setImages] = useState<ProductImage[]>([])
  const [videoAttachmentId, setVideoAttachmentId] = useState<number>()
  const [videoName, setVideoName] = useState("")
  const [videoUrl, setVideoUrl] = useState<string>()
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [editorVersion, setEditorVersion] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [creationProblem, setCreationProblem] = useState<string | null>(null)
  const form = useForm<ProductInputs, unknown, ProductValues>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: productValues(),
  })

  useEffect(() => {
    if (!detailsQuery.data) return

    form.reset(productValues(detailsQuery.data))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImages(productImages(detailsQuery.data))
    setVariants(productVariants(detailsQuery.data))
    setVideoAttachmentId(detailsQuery.data.videoAttachmentId)
    setVideoName(detailsQuery.data.videoUrl ? t("product.video") : "")
    setVideoUrl(detailsQuery.data.videoUrl)
  }, [detailsQuery.data, form, t])

  const organizationCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.organizationId === organizationId
  )
  const categories =
    detailsQuery.data?.categoryId !== undefined &&
    !organizationCategories.some(
      (category) => category.id === detailsQuery.data?.categoryId
    )
      ? [
          ...organizationCategories,
          {
            id: detailsQuery.data.categoryId,
            name: detailsQuery.data.categoryName,
            organizationId,
          },
        ]
      : organizationCategories
  const activeBranches = (branchesQuery.data?.content ?? []).filter(
    (branch) => branch.active !== false
  )
  const branches =
    detailsQuery.data?.branchId !== undefined &&
    !activeBranches.some((branch) => branch.id === detailsQuery.data?.branchId)
      ? [
          ...activeBranches,
          {
            id: detailsQuery.data.branchId,
            name: detailsQuery.data.branchName,
            organizationId,
            active: true,
          },
        ]
      : activeBranches
  const colors = (colorsQuery.data ?? []).filter(
    (color) =>
      color.organizationId === undefined ||
      color.organizationId === organizationId
  )
  const sizes = (sizesQuery.data ?? []).filter(
    (size) =>
      size.organizationId === undefined ||
      size.organizationId === organizationId
  )

  function reportCreationProblem(message: string, targetStep = step) {
    setStep(targetStep)

    if (!editing && onCancel) {
      setCreationProblem(message)
      return
    }

    toast.error(message)
  }

  function firstBasicError() {
    return basicFields
      .map((field) => form.getFieldState(field).error?.message)
      .find((message): message is string => Boolean(message))
  }

  async function nextStep() {
    if (step === 0) {
      if (categoriesQuery.isError || branchesQuery.isError) {
        reportCreationProblem(t("product.referenceDataFailed"), 0)
        return
      }

      const valid = await form.trigger(basicFields)
      if (!valid) {
        reportCreationProblem(
          firstBasicError() ?? t("product.formIncomplete"),
          0
        )
        return
      }
    }

    if (step === 2 && !validateVariants()) return
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function handleImages(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/")
    )
    if (selectedFiles.length === 0) return

    try {
      const uploaded = await uploadImages.mutateAsync({
        data: { files: selectedFiles },
      })
      const validUploads = uploaded.flatMap((attachment, index) =>
        attachment.id === undefined
          ? []
          : [
              {
                attachmentId: attachment.id,
                name:
                  attachment.fileName ?? selectedFiles[index]?.name ?? "Image",
                url: attachment.s3Url,
              },
            ]
      )
      if (validUploads.length !== selectedFiles.length) {
        throw new Error("Some product images are missing attachment IDs")
      }

      setImages((current) => {
        const startIndex = current.length
        return [
          ...current,
          ...validUploads.map((image, index) => ({
            ...image,
            main: current.length === 0 && index === 0,
            sortOrder: startIndex + index,
          })),
        ]
      })
      toast.success(t("product.imagesUploaded"))
    } catch {
      reportCreationProblem(t("product.mediaUploadFailed"), 1)
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  async function handleVideo(file?: File) {
    if (!file) return
    if (!file.type.startsWith("video/")) {
      toast.error(t("product.videoTypeInvalid"))
      return
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(t("product.videoTooLarge"))
      if (videoInputRef.current) videoInputRef.current.value = ""
      return
    }

    try {
      const attachment = await uploadVideo.mutateAsync({
        params: { organizationId },
        data: { file },
      })
      if (attachment.id === undefined) throw new Error("Missing attachment ID")
      setVideoAttachmentId(attachment.id)
      setVideoName(attachment.fileName ?? file.name)
      setVideoUrl(attachment.s3Url)
      toast.success(t("product.videoUploaded"))
    } catch {
      reportCreationProblem(t("product.mediaUploadFailed"), 1)
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  function setMainImage(attachmentId: number) {
    setImages((current) =>
      current.map((image) => ({
        ...image,
        main: image.attachmentId === attachmentId,
      }))
    )
  }

  function removeImage(attachmentId: number) {
    setImages((current) => {
      const removed = current.find(
        (image) => image.attachmentId === attachmentId
      )
      const next = current
        .filter((image) => image.attachmentId !== attachmentId)
        .map((image, index) => ({ ...image, sortOrder: index }))
      if (removed?.main && next[0]) next[0] = { ...next[0], main: true }
      return next
    })
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const destination = index + direction
      if (destination < 0 || destination >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(index, 1)
      if (!moved) return current
      next.splice(destination, 0, moved)
      return next.map((image, sortOrder) => ({ ...image, sortOrder }))
    })
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      { colorId: "", sizeId: "", stock: "0", price: "", active: true },
    ])
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setVariants((current) =>
      current.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, ...patch } : variant
      )
    )
  }

  function validateVariants() {
    const invalid = variants.some(
      (variant) =>
        !Number.isSafeInteger(Number(variant.colorId)) ||
        Number(variant.colorId) <= 0 ||
        !Number.isSafeInteger(Number(variant.sizeId)) ||
        Number(variant.sizeId) <= 0 ||
        !Number.isInteger(Number(variant.stock)) ||
        Number(variant.stock) < 0 ||
        (variant.price !== "" && Number(variant.price) < 0)
    )
    const combinations = variants.map(
      (variant) => `${variant.colorId}:${variant.sizeId}`
    )

    if (invalid) {
      reportCreationProblem(t("product.variantIncomplete"), 2)
      return false
    }
    if (new Set(combinations).size !== combinations.length) {
      reportCreationProblem(t("product.variantDuplicate"), 2)
      return false
    }
    return true
  }

  function variantPayload(): ProductVariantCreateDTO[] {
    return variants.map((variant) => ({
      ...(variant.id !== undefined ? { id: variant.id } : {}),
      colorId: Number(variant.colorId),
      sizeId: Number(variant.sizeId),
      stock: Number(variant.stock),
      ...(variant.price !== "" ? { price: Number(variant.price) } : {}),
      active: variant.active,
    }))
  }

  function fillLocalizedFields() {
    const sourceName = form.getValues("name")?.trim()
    const sourceDescription = form.getValues("descriptionUz")?.trim()

    if (!sourceName && !sourceDescription) {
      toast.error(t("product.translationSourceMissing"))
      return
    }

    if (sourceName) {
      form.setValue("nameRu", sourceName, { shouldDirty: true })
    }
    if (sourceDescription) {
      form.setValue("descriptionRu", sourceDescription, { shouldDirty: true })
    }
    setEditorVersion((current) => current + 1)
    toast.success(t("product.localizedFieldsFilled"))
  }

  async function submit(values: ProductValues) {
    if (!validateVariants()) {
      setStep(2)
      return
    }

    const data = {
      name: values.name,
      ...(values.nameRu ? { nameRu: values.nameRu } : {}),
      ...(values.descriptionUz ? { descriptionUz: values.descriptionUz } : {}),
      ...(values.descriptionRu ? { descriptionRu: values.descriptionRu } : {}),
      categoryId: values.categoryId,
      organizationId,
      branchId: values.branchId,
      basePrice: values.basePrice,
      amount: values.amount,
      discountPercent: values.discountPercent,
      active: values.active,
      ...(videoAttachmentId !== undefined ? { videoAttachmentId } : {}),
      images: images.map(({ id, attachmentId, main, sortOrder }) => ({
        ...(id !== undefined ? { id } : {}),
        attachmentId,
        main,
        sortOrder,
      })),
      variants: variantPayload(),
    }

    try {
      if (editing && productId !== undefined) {
        await update.mutateAsync({ id: productId, data })
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
      reportCreationProblem(
        t(editing ? "notifications.updateFailed" : "notifications.createFailed")
      )
    }
  }

  function handleInvalidSubmit() {
    reportCreationProblem(firstBasicError() ?? t("product.formIncomplete"), 0)
  }

  function returnToCreationForm() {
    setCreationProblem(null)
    if (categoriesQuery.isError) void categoriesQuery.refetch()
    if (branchesQuery.isError) void branchesQuery.refetch()
  }

  const pending =
    create.isPending ||
    update.isPending ||
    uploadImages.isPending ||
    uploadVideo.isPending
  const categoryOptions = getCategoryOptions(categories)

  if (editing && detailsQuery.isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        {t("product.loadingDetails")}
      </p>
    )
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={form.handleSubmit(submit, handleInvalidSubmit)}
      noValidate
    >
      <div className="grid gap-8">
        <div className="grid min-w-0 gap-6">
          <ol
            className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-2 lg:grid-cols-4"
            aria-label={t("product.formSteps")}
          >
            {steps.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  className={cn(
                    "min-h-16 w-full rounded-xl px-4 py-3 text-left transition",
                    index === step
                      ? "bg-background shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                  disabled={pending}
                  onClick={() => setStep(index)}
                >
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      index === step && "text-foreground",
                      index < step && "hover:text-foreground"
                    )}
                  >
                    {index + 1}. {t(`product.step.${item}`)}
                  </span>
                  <span className="mt-1 block text-xs">
                    {t(`product.stepDescription.${item}`)}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          {step === 0 ? (
            <BasicStep
              form={form}
              categories={categories}
              branches={branches}
              editorVersion={editorVersion}
              onFillLocalizedFields={fillLocalizedFields}
              t={t}
            />
          ) : null}
          {step === 1 ? (
            <MediaStep
              images={images}
              videoName={videoName}
              videoUrl={videoUrl}
              imageInputRef={imageInputRef}
              videoInputRef={videoInputRef}
              uploadingImages={uploadImages.isPending}
              uploadingVideo={uploadVideo.isPending}
              onImages={handleImages}
              onVideo={handleVideo}
              onMainImage={setMainImage}
              onRemoveImage={removeImage}
              onMoveImage={moveImage}
              onRemoveVideo={() => {
                setVideoAttachmentId(undefined)
                setVideoName("")
                setVideoUrl(undefined)
              }}
              t={t}
            />
          ) : null}
          {step === 2 ? (
            <VariantsStep
              variants={variants}
              colors={colors}
              sizes={sizes}
              onAdd={addVariant}
              onChange={updateVariant}
              onRemove={(index) =>
                setVariants((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index)
                )
              }
              t={t}
            />
          ) : null}
          {step === 3 ? (
            <ReviewStep
              values={form.getValues() as ProductValues}
              images={images}
              videoName={videoName}
              videoUrl={videoUrl}
              variants={variants}
              colors={colors}
              sizes={sizes}
              categoryName={
                categoryOptions.find(
                  ({ category }) =>
                    category.id === Number(form.getValues("categoryId"))
                )?.label
              }
              branchName={
                branches.find(
                  (branch) => branch.id === Number(form.getValues("branchId"))
                )?.name
              }
              t={t}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setPreviewOpen(true)}
            >
              {t("product.previewProduct")}
            </Button>
            {!editing && step === steps.length - 1 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep(0)}
              >
                {t("product.edit")}
              </Button>
            ) : null}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  {t("product.previousStep")}
                </Button>
              ) : null}
              {editing ? (
                <Button type="submit" disabled={pending}>
                  {t("product.save")}
                </Button>
              ) : null}
              {step < steps.length - 1 ? (
                <Button type="button" disabled={pending} onClick={nextStep}>
                  {t("product.nextStep")}
                </Button>
              ) : !editing ? (
                <Button type="submit" disabled={pending}>
                  {t("product.publish")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[94vh] overflow-y-auto p-0 sm:max-w-[min(96vw,1280px)]">
          <DialogHeader className="border-b px-6 py-5 text-left">
            <DialogTitle>{t("product.previewProduct")}</DialogTitle>
            <DialogDescription>
              {t("product.previewDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 lg:p-8">
            <ReviewStep
              values={form.getValues() as ProductValues}
              images={images}
              videoName={videoName}
              videoUrl={videoUrl}
              variants={variants}
              colors={colors}
              sizes={sizes}
              categoryName={
                categoryOptions.find(
                  ({ category }) =>
                    category.id === Number(form.getValues("categoryId"))
                )?.label
              }
              branchName={
                branches.find(
                  (branch) => branch.id === Number(form.getValues("branchId"))
                )?.name
              }
              t={t}
            />
          </div>
        </DialogContent>
      </Dialog>

      {!editing && onCancel ? (
        <ProductCreationProblemDialog
          open={creationProblem !== null}
          message={creationProblem ?? t("product.formIncomplete")}
          onOpenChange={(open) => {
            if (!open) setCreationProblem(null)
          }}
          onReturn={returnToCreationForm}
          onCancelCreation={() => {
            setCreationProblem(null)
            onCancel()
          }}
        />
      ) : null}
    </form>
  )
}

function BasicStep({
  form,
  categories,
  branches,
  editorVersion,
  onFillLocalizedFields,
  t,
}: {
  form: ReturnType<typeof useForm<ProductInputs, unknown, ProductValues>>
  categories: CategoryDTO[]
  branches: Array<{ id?: number; name?: string; address?: string }>
  editorVersion: number
  onFillLocalizedFields: () => void
  t: Translation
}) {
  const basePrice = Number(
    useWatch({ control: form.control, name: "basePrice" }) || 0
  )
  const discountPercent = Number(
    useWatch({ control: form.control, name: "discountPercent" }) || 0
  )
  const discountedPrice = Math.max(
    0,
    basePrice * (1 - Math.min(100, Math.max(0, discountPercent)) / 100)
  )
  const categoryOptions = getCategoryOptions(categories)

  return (
    <section className="grid gap-5">
      <ProductField
        label={t("product.name")}
        error={form.formState.errors.name?.message}
      >
        <Input {...form.register("name")} />
      </ProductField>
      <ProductField
        label={t("product.nameRu")}
        error={form.formState.errors.nameRu?.message}
      >
        <Input {...form.register("nameRu")} />
      </ProductField>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed bg-muted/30 p-4">
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("product.fillLocalizedFieldsDescription")}
        </p>
        <Button type="button" variant="outline" onClick={onFillLocalizedFields}>
          {t("product.fillLocalizedFields")}
        </Button>
      </div>
      <div className="grid gap-5">
        {(["descriptionUz", "descriptionRu"] as const).map((name) => (
          <ProductField
            key={name}
            label={t(`product.${name}`)}
            error={form.formState.errors[name]?.message}
          >
            <Controller
              control={form.control}
              name={name}
              render={({ field }) => (
                <RichTextEditor
                  key={`${name}-${editorVersion}`}
                  value={field.value as string}
                  output="html"
                  placeholder={t(`product.${name}`)}
                  editorContentClassName="min-h-36"
                  onBlur={field.onBlur}
                  onChange={(content) =>
                    field.onChange(
                      typeof content === "string"
                        ? content
                        : JSON.stringify(content)
                    )
                  }
                />
              )}
            />
          </ProductField>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProductField
          label={t("product.category")}
          error={form.formState.errors.categoryId?.message}
        >
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => {
              const selected = categoryOptions.find(
                ({ category }) => category.id === Number(field.value)
              )

              return (
                <Select
                  noOptions={t("select.noCategories")}
                  value={field.value ? String(field.value) : ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className="w-full"
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(form.formState.errors.categoryId)}
                  >
                    <SelectValue placeholder={t("product.selectCategory")}>
                      {selected?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(({ category, depth, label }) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        <span className="flex min-w-0 items-center gap-2">
                          {depth > 0 ? (
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-muted-foreground"
                            >
                              {"↳".repeat(Math.min(depth, 3))}
                            </span>
                          ) : null}
                          <span className="truncate">{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
        </ProductField>
        <ProductField
          label={t("product.branch")}
          error={form.formState.errors.branchId?.message}
        >
          <Controller
            control={form.control}
            name="branchId"
            render={({ field }) => {
              const selected = branches.find(
                (branch) => branch.id === Number(field.value)
              )
              const selectedLabel = selected
                ? `${selected.name ?? "—"}${selected.address ? ` · ${selected.address}` : ""}`
                : undefined

              return (
                <Select
                  noOptions={t("select.noBranches")}
                  value={field.value ? String(field.value) : ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className="w-full"
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(form.formState.errors.branchId)}
                  >
                    <SelectValue placeholder={t("product.selectBranch")}>
                      {selectedLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) =>
                      branch.id !== undefined ? (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                          {branch.address ? ` · ${branch.address}` : ""}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              )
            }}
          />
        </ProductField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ProductField
          label={t("product.basePrice")}
          error={form.formState.errors.basePrice?.message}
        >
          <Controller
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <PriceInput
                value={field.value as string | number}
                onBlur={field.onBlur}
                onValueChange={field.onChange}
              />
            )}
          />
        </ProductField>
        <ProductField
          label={t("product.amount")}
          error={form.formState.errors.amount?.message}
        >
          <Input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className="tabular-nums"
            {...form.register("amount")}
          />
        </ProductField>
        <ProductField
          label={t("product.discountPercent")}
          error={form.formState.errors.discountPercent?.message}
        >
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              className="pr-10"
              {...form.register("discountPercent")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
              %
            </span>
          </div>
        </ProductField>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t("product.finalPrice")}
        </span>
        <strong className="text-lg text-primary">
          {formatPrice(discountedPrice)} {PRICE_SUFFIX}
        </strong>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={Boolean(form.watch("active"))}
          onCheckedChange={(checked) =>
            form.setValue("active", checked === true, { shouldDirty: true })
          }
        />
        {t("product.active")}
      </label>
    </section>
  )
}

function PriceInput({
  value,
  onBlur,
  onValueChange,
}: {
  value: string | number | undefined
  onBlur?: () => void
  onValueChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="pr-16 tabular-nums"
        value={formatPriceInput(value)}
        onBlur={onBlur}
        onChange={(event) =>
          onValueChange(sanitizePriceInput(event.target.value))
        }
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">
        {PRICE_SUFFIX}
      </span>
    </div>
  )
}

function MediaStep({
  images,
  videoName,
  videoUrl,
  imageInputRef,
  videoInputRef,
  uploadingImages,
  uploadingVideo,
  onImages,
  onVideo,
  onMainImage,
  onRemoveImage,
  onMoveImage,
  onRemoveVideo,
  t,
}: {
  images: ProductImage[]
  videoName: string
  videoUrl?: string
  imageInputRef: React.RefObject<HTMLInputElement | null>
  videoInputRef: React.RefObject<HTMLInputElement | null>
  uploadingImages: boolean
  uploadingVideo: boolean
  onImages: (files: FileList | null) => void
  onVideo: (file?: File) => void
  onMainImage: (id: number) => void
  onRemoveImage: (id: number) => void
  onMoveImage: (index: number, direction: -1 | 1) => void
  onRemoveVideo: () => void
  t: Translation
}) {
  const imagePosition = (index: number) => {
    if (index === 0) return t("product.imageFront")
    if (index === 1) return t("product.imageSide")
    if (index === 2) return t("product.imageBack")
    return t("product.imageDetail", { number: index - 2 })
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-3">
        <div>
          <h3 className="font-medium">{t("product.images")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("product.imagesDescription")}
          </p>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void onImages(event.target.files)}
        />
        <Attachment
          state={uploadingImages ? "uploading" : "idle"}
          className="min-h-28 w-full cursor-pointer items-center px-5 hover:border-primary/50 hover:bg-primary/5"
        >
          <AttachmentMedia className="size-14 text-primary">
            <HugeiconsIcon icon={ImageAdd01Icon} className="size-7" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{t("product.uploadImages")}</AttachmentTitle>
            <AttachmentDescription>
              {t("product.imageFormats")}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger
            aria-label={t("product.uploadImages")}
            onClick={() => imageInputRef.current?.click()}
          />
        </Attachment>
        <AttachmentGroup className="grid grid-cols-1 gap-5 overflow-visible sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <Attachment
              key={image.attachmentId}
              orientation="vertical"
              className={cn(
                "w-full! overflow-hidden rounded-3xl p-0 shadow-sm",
                image.main && "border-primary ring-2 ring-primary/15"
              )}
            >
              <AttachmentMedia
                variant={image.url ? "image" : "icon"}
                className="aspect-[4/3] w-full! rounded-none opacity-100!"
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <HugeiconsIcon icon={ImageAdd01Icon} className="size-9" />
                )}
              </AttachmentMedia>
              <AttachmentContent className="w-full! px-4! pt-4!">
                <AttachmentTitle className="text-base">
                  {imagePosition(index)}
                </AttachmentTitle>
                <AttachmentDescription>
                  {image.name} ·{" "}
                  {t("product.imagePosition", {
                    position: index + 1,
                    total: images.length,
                  })}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  type="button"
                  onClick={() => onRemoveImage(image.attachmentId)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </AttachmentAction>
              </AttachmentActions>
              <div className="flex w-full gap-2 px-4 pb-4">
                <Button
                  type="button"
                  size="sm"
                  variant={image.main ? "default" : "outline"}
                  onClick={() => onMainImage(image.attachmentId)}
                >
                  {t("product.main")}
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => onMoveImage(index, -1)}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={index === images.length - 1}
                  onClick={() => onMoveImage(index, 1)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Button>
              </div>
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>

      <div className="grid gap-4 rounded-3xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Video01Icon} className="size-6" />
          </span>
          <div>
            <h3 className="text-lg font-semibold">{t("product.video")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("product.videoDescription")}
            </p>
          </div>
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => void onVideo(event.target.files?.[0])}
        />
        {videoName ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            {videoUrl ? <VideoPlayer src={videoUrl} title={videoName} /> : null}
            <Attachment className="w-full items-center p-3">
              <AttachmentMedia className="text-primary">
                <HugeiconsIcon icon={Video01Icon} className="size-5" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{videoName}</AttachmentTitle>
                <AttachmentDescription>
                  {videoUrl ? t("product.videoUploaded") : ""}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction type="button" onClick={onRemoveVideo}>
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          </div>
        ) : (
          <Attachment state={uploadingVideo ? "uploading" : "idle"}>
            <AttachmentMedia className="text-primary">
              <HugeiconsIcon icon={Video01Icon} className="size-5" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{t("product.uploadVideo")}</AttachmentTitle>
              <AttachmentDescription>
                {t("product.videoLimit")}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger
              aria-label={t("product.uploadVideo")}
              onClick={() => videoInputRef.current?.click()}
            />
          </Attachment>
        )}
      </div>
    </section>
  )
}

function VariantsStep({
  variants,
  colors,
  sizes,
  onAdd,
  onChange,
  onRemove,
  t,
}: {
  variants: ProductVariant[]
  colors: Array<{ id?: number; name?: string; hexCode?: string }>
  sizes: Array<{ id?: number; value?: string }>
  onAdd: () => void
  onChange: (index: number, patch: Partial<ProductVariant>) => void
  onRemove: (index: number) => void
  t: Translation
}) {
  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-3xl bg-muted/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">{t("product.variants")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("product.variantsDescription")}
          </p>
        </div>
        <Button type="button" onClick={onAdd}>
          <HugeiconsIcon icon={Add01Icon} className="size-5" />
          {t("product.addVariant")}
        </Button>
      </div>
      {variants.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("product.noVariants")}
        </p>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-2">
        {variants.map((variant, index) => {
          const selectedColor = colors.find(
            (color) => color.id === Number(variant.colorId)
          )
          return (
            <div
              key={variant.id ?? index}
              className="rounded-3xl border bg-card p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="size-10 rounded-xl border bg-muted"
                    style={{ backgroundColor: selectedColor?.hexCode }}
                  />
                  <div>
                    <h4 className="font-semibold">
                      {t("product.variantNumber", { number: index + 1 })}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedColor?.name || t("product.color")} ·{" "}
                      {sizes.find((size) => size.id === Number(variant.sizeId))
                        ?.value || t("product.size")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  aria-label={t("product.removeVariant")}
                  onClick={() => onRemove(index)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProductField label={t("product.color")}>
                  <Select
                    noOptions={t("select.noColors")}
                    value={variant.colorId}
                    onValueChange={(nextValue) =>
                      onChange(index, { colorId: nextValue })
                    }
                  >
                    <SelectTrigger
                      aria-label={t("product.color")}
                      className="h-11 w-full rounded-xl bg-background"
                    >
                      <SelectValue placeholder={t("product.color")} />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) =>
                        color.id !== undefined ? (
                          <SelectItem key={color.id} value={String(color.id)}>
                            {color.name}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                </ProductField>
                <ProductField label={t("product.size")}>
                  <Select
                    noOptions={t("select.noSizes")}
                    value={variant.sizeId}
                    onValueChange={(nextValue) =>
                      onChange(index, { sizeId: nextValue })
                    }
                  >
                    <SelectTrigger
                      aria-label={t("product.size")}
                      className="h-11 w-full rounded-xl bg-background"
                    >
                      <SelectValue placeholder={t("product.size")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) =>
                        size.id !== undefined ? (
                          <SelectItem key={size.id} value={String(size.id)}>
                            {size.value}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                </ProductField>
                <ProductField label={t("product.stock")}>
                  <Input
                    type="number"
                    min="0"
                    placeholder={t("product.stock")}
                    value={variant.stock}
                    onChange={(event) =>
                      onChange(index, { stock: event.target.value })
                    }
                  />
                </ProductField>
                <ProductField label={t("product.variantPrice")}>
                  <PriceInput
                    value={variant.price}
                    onValueChange={(price) => onChange(index, { price })}
                  />
                </ProductField>
              </div>
              <label className="mt-5 flex items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm font-medium">
                <Checkbox
                  checked={variant.active}
                  onCheckedChange={(checked) =>
                    onChange(index, { active: checked === true })
                  }
                />
                {t("product.variantEnabled")}
              </label>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ReviewStep({
  values,
  images,
  videoName,
  videoUrl,
  variants,
  colors,
  sizes,
  categoryName,
  branchName,
  t,
}: {
  values: ProductValues
  images: ProductImage[]
  videoName: string
  videoUrl?: string
  variants: ProductVariant[]
  colors: Array<{ id?: number; name?: string; hexCode?: string }>
  sizes: Array<{ id?: number; value?: string }>
  categoryName?: string
  branchName?: string
  t: Translation
}) {
  const sortedImages = [...images].sort(
    (a, b) =>
      Number(b.main) - Number(a.main) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  const basePrice = Number(values.basePrice)
  const discount = Number(values.discountPercent)
  const price = basePrice * (1 - discount / 100)
  const uniqueColorIds = [
    ...new Set(variants.map((variant) => variant.colorId)),
  ]
  const uniqueSizeIds = [...new Set(variants.map((variant) => variant.sizeId))]
  const descriptions = [
    [t("product.descriptionUz"), values.descriptionUz],
    [t("product.descriptionRu"), values.descriptionRu],
  ].filter((item): item is [string, string] => Boolean(item[1]))

  return (
    <section className="grid gap-6">
      <div>
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary capitalize">
            {t("product.livePreview")}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            {t("product.reviewTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("product.reviewDescription")}
          </p>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="grid gap-3 bg-background p-5 sm:grid-cols-[76px_minmax(0,1fr)]">
          {sortedImages.length > 0 ? (
            <>
              <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
                {sortedImages.slice(0, 6).map((image, index) => (
                  <div
                    key={`${image.attachmentId}-${index}`}
                    className={cn(
                      "size-[68px] shrink-0 overflow-hidden rounded-xl border bg-muted",
                      index === 0 && "border-primary ring-2 ring-primary/20"
                    )}
                  >
                    {image.url ? (
                      <img
                        src={image.url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="order-1 aspect-square overflow-hidden rounded-3xl border bg-muted sm:order-2">
                {sortedImages[0]?.url ? (
                  <img
                    src={sortedImages[0].url}
                    alt={values.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-sm text-muted-foreground">
                    {t("product.noPreviewImage")}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[32rem] items-center justify-center rounded-3xl bg-muted text-sm text-muted-foreground sm:col-span-2">
              {t("product.noPreviewImage")}
            </div>
          )}
        </div>

        <div className="grid content-start gap-6 p-6 lg:p-8">
          <div>
            <p className="text-sm font-medium text-primary">
              {categoryName ?? "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("product.branch")}: {branchName ?? "—"}
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              {values.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
              {values.nameRu ? <span>{values.nameRu}</span> : null}
            </div>
          </div>

          {values.descriptionUz ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: values.descriptionUz }}
            />
          ) : null}

          <div>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-semibold">
                {formatPrice(price)} {PRICE_SUFFIX}
              </p>
              {discount > 0 ? (
                <p className="text-base text-muted-foreground line-through">
                  {formatPrice(basePrice)} {PRICE_SUFFIX}
                </p>
              ) : null}
            </div>
            {discount > 0 ? (
              <span className="mt-2 inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                -{discount}%
              </span>
            ) : null}
          </div>

          {uniqueColorIds.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-medium">{t("product.color")}</p>
              <div className="flex flex-wrap gap-3">
                {uniqueColorIds.map((colorId) => {
                  const color = colors.find(
                    (item) => item.id === Number(colorId)
                  )
                  return (
                    <div
                      key={colorId}
                      className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm"
                    >
                      <span
                        className="size-4 rounded-full border"
                        style={{
                          backgroundColor: color?.hexCode ?? "transparent",
                        }}
                      />
                      {color?.name ?? colorId}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {uniqueSizeIds.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-medium">{t("product.size")}</p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizeIds.map((sizeId) => (
                  <span
                    key={sizeId}
                    className="min-w-14 rounded-full border px-4 py-2 text-center text-sm font-medium"
                  >
                    {sizes.find((item) => item.id === Number(sizeId))?.value ??
                      sizeId}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 border-t pt-5 text-sm">
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-muted-foreground">{t("product.stock")}</p>
              <p className="mt-1 text-lg font-semibold">{values.amount}</p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-muted-foreground">{t("product.status")}</p>
              <p className="mt-1 text-lg font-semibold">
                {values.active ? t("product.active") : t("product.inactive")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">{t("product.variants")}</h3>
          {variants.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {variants.map((variant, index) => (
                <div
                  key={`${variant.colorId}-${variant.sizeId}-${index}`}
                  className="grid grid-cols-3 gap-3 rounded-xl bg-muted/60 p-3 text-sm"
                >
                  <span>
                    {colors.find((item) => item.id === Number(variant.colorId))
                      ?.name ?? "—"}
                  </span>
                  <span>
                    {sizes.find((item) => item.id === Number(variant.sizeId))
                      ?.value ?? "—"}
                  </span>
                  <span className="text-right">
                    {formatPrice(Number(variant.price || basePrice))}{" "}
                    {PRICE_SUFFIX}
                    {" · "}
                    {variant.stock}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("product.noVariants")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">{t("product.mediaSummary")}</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("product.images")}</dt>
              <dd>{images.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("product.video")}</dt>
              <dd>{videoName || "—"}</dd>
            </div>
            {videoUrl ? (
              <VideoPlayer className="mt-2" src={videoUrl} title={videoName} />
            ) : null}
          </dl>
        </div>
      </div>

      {descriptions.length > 0 ? (
        <div className="grid gap-3">
          {descriptions.map(([label, description]) => (
            <details
              key={label}
              className="rounded-2xl border bg-card p-5"
              open={label === t("product.descriptionUz")}
            >
              <summary className="cursor-pointer font-semibold">
                {label}
              </summary>
              <div
                className="prose prose-sm dark:prose-invert mt-4 max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </details>
          ))}
        </div>
      ) : null}
    </section>
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
    <div className="grid min-w-0 gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
