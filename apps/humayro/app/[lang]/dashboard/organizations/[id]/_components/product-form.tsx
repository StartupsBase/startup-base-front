"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import type {
  ProductDTO,
  ProductImageCreateDTO,
  ProductListDTO,
  ProductVariantCreateDTO,
} from "@/lib/api"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  useUploadImages,
  useUploadVideo,
} from "@/lib/api/generated/attachment-controller/attachment-controller"
import { useGetAll4 } from "@/lib/api/generated/category/category"
import { useGetAll3 as useGetColors } from "@/lib/api/generated/color/color"
import {
  getGetAll2QueryKey,
  useCreate2,
  useGetById2,
  useUpdate3,
} from "@/lib/api/generated/product/product"
import { useGetAll1 as useGetSizes } from "@/lib/api/generated/size/size"
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
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

const MAX_VIDEO_SIZE = 5 * 1024 * 1024

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
type ProductSource = ProductListDTO | ProductDTO

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

function productValues(product?: ProductSource): ProductInputs {
  const detailed = product as ProductDTO | undefined

  return {
    name: product?.name ?? "",
    nameRu: product?.nameRu ?? "",
    nameEng: product?.nameEng ?? "",
    descriptionUz: detailed?.descriptionUz ?? "",
    descriptionRu: detailed?.descriptionRu ?? "",
    descriptionEng: detailed?.descriptionEng ?? "",
    categoryId: product?.categoryId ?? "",
    basePrice: product?.basePrice ?? 0,
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
  organizationId,
  product,
  onComplete,
  showAssistant = false,
}: {
  organizationId: number
  product?: ProductListDTO
  onComplete: () => void
  showAssistant?: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const editing = product?.id !== undefined
  const detailsQuery = useGetById2(product?.id ?? 0, {
    query: { enabled: editing, retry: false },
  })
  const categoriesQuery = useGetAll4()
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
  const form = useForm<ProductInputs, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productValues(product),
  })
  const previewValues = useWatch({ control: form.control })

  useEffect(() => {
    const source = detailsQuery.data ?? product
    form.reset(productValues(source))

    if (detailsQuery.data) {
      // The edit dialog starts with list data, then hydrates advanced fields
      // once the full product response is available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImages(productImages(detailsQuery.data))
      setVariants(productVariants(detailsQuery.data))
      setVideoAttachmentId(detailsQuery.data.videoAttachmentId)
      setVideoName(detailsQuery.data.videoUrl ? t("product.video") : "")
      setVideoUrl(detailsQuery.data.videoUrl)
    }
  }, [detailsQuery.data, form, product, t])

  const categories = (categoriesQuery.data ?? []).filter(
    (category) => category.organizationId === organizationId
  )
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

  async function nextStep() {
    if (step === 0) {
      const valid = await form.trigger([
        "name",
        "nameRu",
        "nameEng",
        "descriptionUz",
        "descriptionRu",
        "descriptionEng",
        "categoryId",
        "basePrice",
        "discountPercent",
        "active",
      ])
      if (!valid) return
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
      toast.error(t("product.mediaUploadFailed"))
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
      const attachment = await uploadVideo.mutateAsync({ data: { file } })
      if (attachment.id === undefined) throw new Error("Missing attachment ID")
      setVideoAttachmentId(attachment.id)
      setVideoName(attachment.fileName ?? file.name)
      setVideoUrl(attachment.s3Url)
      toast.success(t("product.videoUploaded"))
    } catch {
      toast.error(t("product.mediaUploadFailed"))
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
      toast.error(t("product.variantIncomplete"))
      return false
    }
    if (new Set(combinations).size !== combinations.length) {
      toast.error(t("product.variantDuplicate"))
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
      form.setValue("nameEng", sourceName, { shouldDirty: true })
    }
    if (sourceDescription) {
      form.setValue("descriptionRu", sourceDescription, { shouldDirty: true })
      form.setValue("descriptionEng", sourceDescription, {
        shouldDirty: true,
      })
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

  const pending =
    create.isPending ||
    update.isPending ||
    uploadImages.isPending ||
    uploadVideo.isPending

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
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <div
        className={cn(
          "grid gap-8",
          showAssistant && "xl:grid-cols-[minmax(0,1fr)_20rem]"
        )}
      >
        <div className="grid min-w-0 gap-6">
          <ol
            className="grid grid-cols-4 gap-2"
            aria-label={t("product.formSteps")}
          >
            {steps.map((item, index) => (
              <li key={item}>
                <div
                  className={cn(
                    "h-1.5 rounded-full bg-muted",
                    index <= step && "bg-primary"
                  )}
                />
                <p
                  className={cn(
                    "mt-2 text-xs text-muted-foreground",
                    index === step && "font-medium text-foreground"
                  )}
                >
                  {index + 1}. {t(`product.step.${item}`)}
                </p>
              </li>
            ))}
          </ol>

          {step === 0 ? (
            <BasicStep
              form={form}
              categories={categories}
              editorVersion={editorVersion}
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
              imageCount={images.length}
              videoName={videoName}
              variantCount={variants.length}
              categoryName={
                categories.find(
                  (category) =>
                    category.id === Number(form.getValues("categoryId"))
                )?.name
              }
              t={t}
            />
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || pending}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              {t("product.previousStep")}
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" disabled={pending} onClick={nextStep}>
                {t("product.nextStep")}
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {editing ? t("product.save") : t("product.create")}
              </Button>
            )}
          </div>
        </div>
        {showAssistant ? (
          <ProductAssistant
            values={previewValues}
            images={images}
            variantCount={variants.length}
            categoryName={
              categories.find(
                (category) => category.id === Number(previewValues.categoryId)
              )?.name
            }
            onFillLocalizedFields={fillLocalizedFields}
            t={t}
          />
        ) : null}
      </div>
    </form>
  )
}

type Translation = ReturnType<typeof useTranslation>["t"]

function BasicStep({
  form,
  categories,
  editorVersion,
  t,
}: {
  form: ReturnType<typeof useForm<ProductInputs, unknown, ProductValues>>
  categories: Array<{ id?: number; name?: string }>
  editorVersion: number
  t: Translation
}) {
  return (
    <section className="grid gap-5">
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
      <div className="grid gap-5">
        {(["descriptionUz", "descriptionRu", "descriptionEng"] as const).map(
          (name) => (
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
          )
        )}
      </div>
      <ProductField
        label={t("product.category")}
        error={form.formState.errors.categoryId?.message}
      >
        <Select
          value={String(form.watch("categoryId") || "")}
          onValueChange={(value) =>
            form.setValue("categoryId", value, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("product.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) =>
              category.id !== undefined ? (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select>
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
        <Attachment state={uploadingImages ? "uploading" : "idle"}>
          <AttachmentMedia>IMG</AttachmentMedia>
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
        <AttachmentGroup>
          {images.map((image, index) => (
            <Attachment
              key={image.attachmentId}
              orientation="vertical"
              className={cn(image.main && "border-primary")}
            >
              <AttachmentMedia variant={image.url ? "image" : "icon"}>
                {image.url ? (
                  <span
                    aria-hidden
                    className="size-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${image.url})` }}
                  />
                ) : (
                  "IMG"
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{image.name}</AttachmentTitle>
                <AttachmentDescription>
                  {image.main ? t("product.mainImage") : `#${index + 1}`}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  type="button"
                  onClick={() => onRemoveImage(image.attachmentId)}
                >
                  ×
                </AttachmentAction>
              </AttachmentActions>
              <div className="flex w-full gap-1 px-1 pb-1">
                <Button
                  type="button"
                  size="xs"
                  variant={image.main ? "default" : "outline"}
                  onClick={() => onMainImage(image.attachmentId)}
                >
                  {t("product.main")}
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => onMoveImage(index, -1)}
                >
                  ←
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  disabled={index === images.length - 1}
                  onClick={() => onMoveImage(index, 1)}
                >
                  →
                </Button>
              </div>
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>

      <div className="grid gap-3">
        <div>
          <h3 className="font-medium">{t("product.video")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("product.videoDescription")}
          </p>
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
          <Attachment>
            <AttachmentMedia>VID</AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{videoName}</AttachmentTitle>
              <AttachmentDescription>
                {videoUrl ? t("product.videoUploaded") : ""}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction type="button" onClick={onRemoveVideo}>
                ×
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        ) : (
          <Attachment state={uploadingVideo ? "uploading" : "idle"}>
            <AttachmentMedia>VID</AttachmentMedia>
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
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{t("product.variants")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("product.variantsDescription")}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onAdd}>
          {t("product.addVariant")}
        </Button>
      </div>
      {variants.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("product.noVariants")}
        </p>
      ) : null}
      {variants.map((variant, index) => (
        <div
          key={variant.id ?? index}
          className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_110px_130px_auto]"
        >
          <Select
            value={variant.colorId}
            onValueChange={(colorId) => onChange(index, { colorId })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("product.color")} />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) =>
                color.id !== undefined ? (
                  <SelectItem key={color.id} value={String(color.id)}>
                    <span className="flex items-center gap-2">
                      {color.hexCode ? (
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: color.hexCode }}
                        />
                      ) : null}
                      {color.name}
                    </span>
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
          <Select
            value={variant.sizeId}
            onValueChange={(sizeId) => onChange(index, { sizeId })}
          >
            <SelectTrigger className="w-full">
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
          <Input
            type="number"
            min="0"
            placeholder={t("product.stock")}
            value={variant.stock}
            onChange={(event) => onChange(index, { stock: event.target.value })}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={t("product.variantPrice")}
            value={variant.price}
            onChange={(event) => onChange(index, { price: event.target.value })}
          />
          <div className="flex items-center justify-end gap-2">
            <Checkbox
              checked={variant.active}
              onCheckedChange={(checked) =>
                onChange(index, { active: checked === true })
              }
            />
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              onClick={() => onRemove(index)}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
    </section>
  )
}

function ProductAssistant({
  values,
  images,
  variantCount,
  categoryName,
  onFillLocalizedFields,
  t,
}: {
  values: Partial<ProductInputs>
  images: ProductImage[]
  variantCount: number
  categoryName?: string
  onFillLocalizedFields: () => void
  t: Translation
}) {
  const mainImage = images.find((image) => image.main) ?? images[0]
  const basePrice = Number(values.basePrice ?? 0)
  const discount = Number(values.discountPercent ?? 0)
  const discountedPrice = basePrice * (1 - discount / 100)

  return (
    <aside className="self-start xl:sticky xl:top-6">
      <div className="grid gap-5 rounded-3xl border bg-card p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            {t("product.livePreview")}
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {values.name || t("product.unnamedProduct")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryName ?? t("product.selectCategory")}
          </p>
        </div>

        <div
          className="aspect-square rounded-2xl bg-muted bg-cover bg-center"
          style={
            mainImage?.url
              ? { backgroundImage: `url(${mainImage.url})` }
              : undefined
          }
        >
          {!mainImage?.url ? (
            <span className="flex size-full items-center justify-center text-sm text-muted-foreground">
              {t("product.noPreviewImage")}
            </span>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-semibold">
              {discountedPrice.toLocaleString()}
            </p>
            {discount > 0 ? (
              <p className="text-xs text-muted-foreground line-through">
                {basePrice.toLocaleString()}
              </p>
            ) : null}
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
            {variantCount} {t("product.variants").toLowerCase()}
          </span>
        </div>

        {typeof values.descriptionUz === "string" && values.descriptionUz ? (
          <div
            className="line-clamp-4 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: values.descriptionUz }}
          />
        ) : null}

        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onFillLocalizedFields}
          >
            {t("product.fillLocalizedFields")}
          </Button>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t("product.fillLocalizedFieldsDescription")}
          </p>
        </div>
      </div>
    </aside>
  )
}

function ReviewStep({
  values,
  imageCount,
  videoName,
  variantCount,
  categoryName,
  t,
}: {
  values: ProductValues
  imageCount: number
  videoName: string
  variantCount: number
  categoryName?: string
  t: Translation
}) {
  const items = [
    [t("product.name"), values.name],
    [t("product.category"), categoryName ?? "—"],
    [t("product.basePrice"), String(values.basePrice)],
    [t("product.discountPercent"), `${values.discountPercent}%`],
    [t("product.images"), String(imageCount)],
    [t("product.video"), videoName || "—"],
    [t("product.variants"), String(variantCount)],
  ]
  return (
    <section className="grid gap-4">
      <h3 className="text-lg font-medium">{t("product.reviewTitle")}</h3>
      <dl className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
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
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
