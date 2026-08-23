"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form"
import { z } from "zod"

import { Input } from "@/components/input"
import type { Language } from "@/i18n/config"
import { useMe1 } from "@/lib/api"
import { useGetAll10 as useDistricts } from "@/lib/api/generated/district/district"
import { useGetAll9 as useRegions } from "@/lib/api/generated/region/region"
import type { CartItemDTO } from "@/lib/api/model/cartItemDTO"
import type { CheckoutDTO } from "@/lib/api/model/checkoutDTO"
import type { DistrictDTO } from "@/lib/api/model/districtDTO"
import type { RegionDTO } from "@/lib/api/model/regionDTO"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { formatStorefrontPrice } from "@/lib/storefront"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { LocationPickerDialog } from "../../dashboard/organizations/_components/maps/location-picker-dialog"

const checkoutSteps = ["contact", "delivery", "review"] as const
type CheckoutStep = (typeof checkoutSteps)[number]

function createCheckoutSchema(text: ReturnType<typeof useStorefrontCopy>) {
  const required = z.string().trim().min(1, text.requiredField)

  return z.object({
    recipientFirstName: required,
    recipientLastName: required,
    recipientPhone: z.string().regex(/^\+998\d{9}$/, text.invalidPhoneNumber),
    regionId: z.number().int().positive(text.requiredField),
    districtId: z.number().int().positive(text.requiredField),
    deliveryCity: required,
    deliveryDistrict: required,
    street: required,
    houseNumber: required,
    apartmentNumber: z.string().trim().optional(),
    entrance: z.string().trim().optional(),
    floor: z.string().trim().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    deliveryAddress: z.string().trim().optional(),
    addressComment: z.string().trim().max(500).optional(),
    note: z.string().trim().max(1000).optional(),
  })
}

type CheckoutValues = z.infer<ReturnType<typeof createCheckoutSchema>>

const defaultValues: CheckoutValues = {
  recipientFirstName: "",
  recipientLastName: "",
  recipientPhone: "+998",
  regionId: 0,
  districtId: 0,
  deliveryCity: "",
  deliveryDistrict: "",
  street: "",
  houseNumber: "",
  apartmentNumber: "",
  entrance: "",
  floor: "",
  deliveryAddress: "",
  addressComment: "",
  note: "",
}

const stepFields: Record<CheckoutStep, FieldPath<CheckoutValues>[]> = {
  contact: ["recipientFirstName", "recipientLastName", "recipientPhone"],
  delivery: ["regionId", "districtId", "street", "houseNumber"],
  review: [],
}

export function CheckoutStepper({
  items,
  language,
  pending,
  total,
  onBack,
  onSubmit,
}: {
  items: CartItemDTO[]
  language: Language
  pending: boolean
  total: number
  onBack: () => void
  onSubmit: (data: CheckoutDTO) => void
}) {
  const text = useStorefrontCopy()
  const schema = useMemo(() => createCheckoutSchema(text), [text])
  const meQuery = useMe1({ query: { retry: false } })
  const [step, setStep] = useState<CheckoutStep>("contact")
  const [highestStep, setHighestStep] = useState(0)
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  })
  const currentStep = checkoutSteps.indexOf(step)
  const values = useWatch({
    control: form.control,
    defaultValue: defaultValues,
  })
  const selectedRegionId = values.regionId ?? 0
  const regionsQuery = useRegions(
    { page: 0, size: 100 },
    { query: { retry: false } }
  )
  const districtsQuery = useDistricts(
    { regionId: selectedRegionId || undefined, page: 0, size: 100 },
    { query: { enabled: selectedRegionId > 0, retry: false } }
  )
  const regions = regionsQuery.data?.content ?? []
  const districts = districtsQuery.data?.content ?? []
  const latitude = values.latitude
  const longitude = values.longitude
  const mappedAddress = values.deliveryAddress
  const coordinates =
    latitude != null && longitude != null ? { latitude, longitude } : undefined
  const stepTitles = [
    text.checkoutContactStep,
    text.checkoutDeliveryStep,
    text.checkoutReviewStep,
  ]

  useEffect(() => {
    const user = meQuery.data
    if (!user || form.formState.isDirty) return

    form.reset({
      ...form.getValues(),
      recipientFirstName: user.firstname ?? "",
      recipientLastName: user.lastname ?? "",
      recipientPhone: user.phone ?? "+998",
    })
  }, [form, meQuery.data])

  async function goForward() {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true })
    if (!valid) return

    const nextIndex = Math.min(currentStep + 1, checkoutSteps.length - 1)
    setHighestStep((current) => Math.max(current, nextIndex))
    setStep(checkoutSteps[nextIndex] ?? "review")
  }

  function goBack() {
    if (currentStep === 0) {
      onBack()
      return
    }

    setStep(checkoutSteps[currentStep - 1] ?? "contact")
  }

  function selectStep(value: string) {
    const target = value as CheckoutStep
    const targetIndex = checkoutSteps.indexOf(target)
    if (targetIndex <= highestStep) setStep(target)
  }

  function submit(valuesToSubmit: CheckoutValues) {
    const recipientFirstName = valuesToSubmit.recipientFirstName.trim()
    const recipientLastName = valuesToSubmit.recipientLastName.trim()
    const deliveryAddress =
      optionalValue(valuesToSubmit.deliveryAddress) ??
      formatDeliveryAddress(valuesToSubmit)

    onSubmit({
      ...valuesToSubmit,
      recipientFirstName,
      recipientLastName,
      recipientName: `${recipientFirstName} ${recipientLastName}`,
      deliveryAddress,
      apartmentNumber: optionalValue(valuesToSubmit.apartmentNumber),
      entrance: optionalValue(valuesToSubmit.entrance),
      floor: optionalValue(valuesToSubmit.floor),
      addressComment: optionalValue(valuesToSubmit.addressComment),
      note: optionalValue(valuesToSubmit.note),
    })
  }

  function handleInvalid(errors: FieldErrors<CheckoutValues>) {
    const contactHasError = stepFields.contact.some((field) => errors[field])
    setStep(contactHasError ? "contact" : "delivery")
  }

  return (
    <form onSubmit={form.handleSubmit(submit, handleInvalid)} noValidate>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden py-0 shadow-sm">
          <div className="border-b px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {text.checkout}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {text.checkoutDescription}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={onBack}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                {text.backToCart}
              </Button>
            </div>

            <Tabs className="mt-5" value={step} onValueChange={selectStep}>
              <TabsList variant="stepper">
                {checkoutSteps.map((stepValue, index) => (
                  <TabsTrigger
                    key={stepValue}
                    value={stepValue}
                    disabled={index > highestStep}
                    data-complete={index < currentStep || undefined}
                  >
                    <span
                      data-slot="step-indicator"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                    >
                      {index < currentStep ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="size-4"
                        />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="hidden text-left sm:inline">
                      {stepTitles[index]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <CardContent className="px-0 py-7">
                <TabsContent value="contact" className="mt-0 space-y-6">
                  <StepHeading
                    title={text.checkoutContactTitle}
                    description={text.checkoutContactDescription}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      id="checkout-first-name"
                      label={text.recipientFirstName}
                      error={form.formState.errors.recipientFirstName?.message}
                    >
                      <Input
                        id="checkout-first-name"
                        autoComplete="given-name"
                        aria-invalid={Boolean(
                          form.formState.errors.recipientFirstName
                        )}
                        {...form.register("recipientFirstName")}
                      />
                    </FormField>
                    <FormField
                      id="checkout-last-name"
                      label={text.recipientLastName}
                      error={form.formState.errors.recipientLastName?.message}
                    >
                      <Input
                        id="checkout-last-name"
                        autoComplete="family-name"
                        aria-invalid={Boolean(
                          form.formState.errors.recipientLastName
                        )}
                        {...form.register("recipientLastName")}
                      />
                    </FormField>
                    <FormField
                      id="checkout-phone"
                      label={text.recipientPhone}
                      error={form.formState.errors.recipientPhone?.message}
                      className="sm:col-span-2 sm:max-w-md"
                    >
                      <Controller
                        control={form.control}
                        name="recipientPhone"
                        render={({ field }) => (
                          <PhoneInput
                            id="checkout-phone"
                            name={field.name}
                            autoComplete="tel"
                            value={field.value}
                            aria-invalid={Boolean(
                              form.formState.errors.recipientPhone
                            )}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="mt-0 space-y-6">
                  <StepHeading
                    title={text.checkoutDeliveryTitle}
                    description={text.checkoutDeliveryDescription}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      id="checkout-city"
                      label={text.deliveryCity}
                      error={form.formState.errors.regionId?.message}
                    >
                      <Controller
                        control={form.control}
                        name="regionId"
                        render={({ field }) => (
                          <Select
                            value={field.value > 0 ? String(field.value) : ""}
                            disabled={regionsQuery.isPending}
                            onValueChange={(value) => {
                              const regionId = Number(value)
                              field.onChange(regionId)
                              form.setValue(
                                "deliveryCity",
                                getRegionName(
                                  regions.find(
                                    (region) => region.id === regionId
                                  ),
                                  language
                                ),
                                { shouldDirty: true, shouldValidate: true }
                              )
                              form.setValue("districtId", 0, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                              form.setValue("deliveryDistrict", "", {
                                shouldDirty: true,
                              })
                            }}
                          >
                            <SelectTrigger
                              id="checkout-city"
                              className="w-full rounded-2xl"
                              aria-invalid={Boolean(
                                form.formState.errors.regionId
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  regionsQuery.isPending
                                    ? text.loadingOptions
                                    : text.deliveryCity
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {regions.map((region) =>
                                region.id == null ? null : (
                                  <SelectItem
                                    key={region.id}
                                    value={String(region.id)}
                                  >
                                    {getRegionName(region, language)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                    <FormField
                      id="checkout-district"
                      label={text.deliveryDistrict}
                      error={form.formState.errors.districtId?.message}
                    >
                      <Controller
                        control={form.control}
                        name="districtId"
                        render={({ field }) => (
                          <Select
                            value={field.value > 0 ? String(field.value) : ""}
                            disabled={
                              selectedRegionId === 0 || districtsQuery.isPending
                            }
                            onValueChange={(value) => {
                              const districtId = Number(value)
                              field.onChange(districtId)
                              form.setValue(
                                "deliveryDistrict",
                                getDistrictName(
                                  districts.find(
                                    (district) => district.id === districtId
                                  ),
                                  language
                                ),
                                { shouldDirty: true, shouldValidate: true }
                              )
                            }}
                          >
                            <SelectTrigger
                              id="checkout-district"
                              className="w-full rounded-2xl"
                              aria-invalid={Boolean(
                                form.formState.errors.districtId
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  districtsQuery.isPending
                                    ? text.loadingOptions
                                    : text.deliveryDistrict
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.map((district) =>
                                district.id == null ? null : (
                                  <SelectItem
                                    key={district.id}
                                    value={String(district.id)}
                                  >
                                    {getDistrictName(district, language)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                    <FormField
                      id="checkout-street"
                      label={text.street}
                      error={form.formState.errors.street?.message}
                    >
                      <Input
                        id="checkout-street"
                        autoComplete="address-line1"
                        aria-invalid={Boolean(form.formState.errors.street)}
                        {...form.register("street")}
                      />
                    </FormField>
                    <FormField
                      id="checkout-house"
                      label={text.houseNumber}
                      error={form.formState.errors.houseNumber?.message}
                    >
                      <Input
                        id="checkout-house"
                        autoComplete="address-line2"
                        aria-invalid={Boolean(
                          form.formState.errors.houseNumber
                        )}
                        {...form.register("houseNumber")}
                      />
                    </FormField>
                    <FormField
                      id="checkout-apartment"
                      label={`${text.apartmentNumber} (${text.optional})`}
                    >
                      <Input
                        id="checkout-apartment"
                        {...form.register("apartmentNumber")}
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        id="checkout-entrance"
                        label={`${text.entrance} (${text.optional})`}
                      >
                        <Input
                          id="checkout-entrance"
                          {...form.register("entrance")}
                        />
                      </FormField>
                      <FormField
                        id="checkout-floor"
                        label={`${text.floor} (${text.optional})`}
                      >
                        <Input
                          id="checkout-floor"
                          {...form.register("floor")}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{text.deliveryLocation}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {text.deliveryLocationDescription}
                        </p>
                      </div>
                      <LocationPickerDialog
                        address={mappedAddress}
                        value={coordinates}
                        onSelect={(address, nextCoordinates) => {
                          form.setValue("deliveryAddress", address, {
                            shouldDirty: true,
                          })
                          form.setValue("latitude", nextCoordinates.latitude, {
                            shouldDirty: true,
                          })
                          form.setValue(
                            "longitude",
                            nextCoordinates.longitude,
                            {
                              shouldDirty: true,
                            }
                          )
                        }}
                      />
                    </div>
                    {coordinates ? (
                      <p className="mt-3 text-xs break-words text-muted-foreground">
                        {mappedAddress ||
                          `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`}
                      </p>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="review" className="mt-0 space-y-6">
                  <StepHeading
                    title={text.checkoutReviewTitle}
                    description={text.checkoutReviewDescription}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      id="checkout-address-comment"
                      label={`${text.addressComment} (${text.optional})`}
                    >
                      <textarea
                        id="checkout-address-comment"
                        rows={4}
                        className="flex w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        {...form.register("addressComment")}
                      />
                    </FormField>
                    <FormField
                      id="checkout-note"
                      label={`${text.note} (${text.optional})`}
                    >
                      <textarea
                        id="checkout-note"
                        rows={4}
                        className="flex w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        {...form.register("note")}
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2">
                    <ReviewValue
                      label={text.checkoutContactStep}
                      value={[
                        values.recipientFirstName,
                        values.recipientLastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      detail={formatPhoneNumberInternal(
                        values.recipientPhone ?? ""
                      )}
                    />
                    <ReviewValue
                      label={text.checkoutDeliveryStep}
                      value={formatDeliveryAddress(values)}
                      detail={mappedAddress}
                    />
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>

            <Separator />
            <CardFooter className="justify-between gap-3 px-0 pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={goBack}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                {currentStep === 0 ? text.backToCart : text.previousStep}
              </Button>
              {currentStep < checkoutSteps.length - 1 ? (
                <Button type="button" disabled={pending} onClick={goForward}>
                  {text.nextStep}
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={pending}>
                  {pending ? text.placingOrder : text.placeOrder}
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Button>
              )}
            </CardFooter>
          </div>
        </Card>

        <CheckoutSummary items={items} language={language} total={total} />
      </div>
    </form>
  )
}

function CheckoutSummary({
  items,
  language,
  total,
}: {
  items: CartItemDTO[]
  language: Language
  total: number
}) {
  const text = useStorefrontCopy()

  return (
    <Card className="gap-0 py-0 shadow-sm lg:sticky lg:top-24">
      <CardHeader className="border-b px-5 py-5">
        <CardTitle>{text.orderSummary}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)}{" "}
          {text.pieces}
        </p>
      </CardHeader>
      <CardContent className="max-h-80 space-y-4 overflow-y-auto px-5 py-5">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="flex gap-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">
                {item.productName || "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.quantity ?? 0} {text.pieces}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold">
              {formatStorefrontPrice(item.subtotal, language)}
            </p>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 border-t bg-muted/25 px-5 py-5">
        <SummaryLine label={text.shippingCost} value={text.freeShipping} />
        <SummaryLine
          label={text.total}
          value={formatStorefrontPrice(total, language)}
          emphasized
        />
      </CardFooter>
    </Card>
  )
}

function FormField({
  children,
  className,
  error,
  id,
  label,
}: {
  children: React.ReactNode
  className?: string
  error?: string
  id: string
  label: string
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function StepHeading({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function ReviewValue({
  detail,
  label,
  value,
}: {
  detail?: string
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
      {detail ? (
        <p className="mt-1 text-xs break-words text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function SummaryLine({
  emphasized,
  label,
  value,
}: {
  emphasized?: boolean
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          emphasized ? "font-semibold" : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={emphasized ? "text-lg font-bold" : "text-sm font-medium"}
      >
        {value}
      </span>
    </div>
  )
}

function formatDeliveryAddress(values: Partial<CheckoutValues>) {
  const street = [values.street, values.houseNumber].filter(Boolean).join(" ")
  const apartment = values.apartmentNumber ? `${values.apartmentNumber}` : ""
  const entrance = values.entrance ? `${values.entrance}` : ""
  const floor = values.floor ? `${values.floor}` : ""

  return [
    values.deliveryCity,
    values.deliveryDistrict,
    street,
    apartment,
    entrance,
    floor,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ")
}

function getRegionName(region: RegionDTO | undefined, language: Language) {
  if (!region) return ""
  return language === "uz"
    ? region.nameUz || region.name || ""
    : region.name || region.nameUz || ""
}

function getDistrictName(
  district: DistrictDTO | undefined,
  language: Language
) {
  if (!district) return ""
  return language === "uz"
    ? district.nameUz || district.name || ""
    : district.name || district.nameUz || ""
}

function optionalValue(value?: string) {
  return value?.trim() || undefined
}
