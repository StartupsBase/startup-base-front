"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import type { OrganizationDTO } from "@/lib/api"
import {
  getGetAll7QueryKey,
  getGetById6QueryKey,
  useCreate7,
  useUpdate7,
} from "@/lib/api/generated/admin-organization/admin-organization"
import { useUploadImage } from "@/lib/api/generated/attachment-controller/attachment-controller"
import { Button } from "@workspace/ui/components/button"
import { DialogFooter } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"

import { ImageCropInput } from "../../profile/_components/image-crop-input"
import { LocationPickerDialog } from "./maps/location-picker-dialog"

const organizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required."),
  description: z.string().trim(),
  contactPerson: z.string().trim(),
  contactEmail: z
    .string()
    .trim()
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Enter a valid email address."
    ),
  contactPhone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+998\d{9}$/.test(value),
      "Enter a valid +998 phone number."
    ),
  inn: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\d{9,14}$/.test(value),
      "INN must contain 9 to 14 digits."
    ),
  address: z.string().trim(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  active: z.boolean(),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

const emptyOrganization: OrganizationFormValues = {
  name: "",
  description: "",
  contactPerson: "",
  contactEmail: "",
  contactPhone: "",
  inn: "",
  address: "",
  latitude: undefined,
  longitude: undefined,
  active: true,
}

function getOrganizationValues(
  organization?: OrganizationDTO
): OrganizationFormValues {
  return {
    name: organization?.name ?? "",
    description: organization?.description ?? "",
    contactPerson: organization?.contactPerson ?? "",
    contactEmail: organization?.contactEmail ?? "",
    contactPhone: organization?.contactPhone ?? "",
    inn: organization?.inn ?? "",
    address: organization?.address ?? "",
    latitude:
      typeof organization?.latitude === "number"
        ? organization.latitude
        : undefined,
    longitude:
      typeof organization?.longitude === "number"
        ? organization.longitude
        : undefined,
    active: organization?.active ?? true,
  }
}

function compactOrganizationPayload(values: OrganizationFormValues) {
  return {
    name: values.name,
    ...(values.description ? { description: values.description } : {}),
    ...(values.contactPerson ? { contactPerson: values.contactPerson } : {}),
    ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
    ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
    ...(values.inn ? { inn: values.inn } : {}),
    ...(values.address ? { address: values.address } : {}),
    ...(values.latitude !== undefined ? { latitude: values.latitude } : {}),
    ...(values.longitude !== undefined ? { longitude: values.longitude } : {}),
  }
}

export function OrganizationForm({
  organization,
  onComplete,
}: {
  organization?: OrganizationDTO
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreate7()
  const update = useUpdate7()
  const uploadLogo = useUploadImage()
  const [logo, setLogo] = useState<File | null>(null)
  const logoPreviewUrl = useMemo(
    () => (logo ? URL.createObjectURL(logo) : null),
    [logo]
  )
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organization
      ? getOrganizationValues(organization)
      : emptyOrganization,
  })
  const organizationName = useWatch({ control: form.control, name: "name" })
  const latitude = useWatch({ control: form.control, name: "latitude" })
  const longitude = useWatch({ control: form.control, name: "longitude" })
  const address = useWatch({ control: form.control, name: "address" })
  const editing = organization?.id !== undefined

  useEffect(
    () => () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    },
    [logoPreviewUrl]
  )

  async function submit(values: OrganizationFormValues) {
    try {
      const uploadedLogo = logo
        ? await uploadLogo.mutateAsync({ data: { file: logo } })
        : null
      const logoId = uploadedLogo?.id ?? organization?.logo?.id
      const payload = {
        ...compactOrganizationPayload(values),
        ...(logoId !== undefined ? { logoId } : {}),
      }

      if (editing && organization.id !== undefined) {
        await update.mutateAsync({
          id: organization.id,
          data: { ...payload, active: values.active },
        })
      } else {
        await create.mutateAsync({ data: payload })
      }

      await queryClient.invalidateQueries({ queryKey: getGetAll7QueryKey() })
      if (organization?.id !== undefined) {
        await queryClient.invalidateQueries({
          queryKey: getGetById6QueryKey(organization.id),
        })
      }
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

  const pending = create.isPending || update.isPending || uploadLogo.isPending
  const logoUrl = logoPreviewUrl ?? organization?.logo?.s3Url
  const coordinates =
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : undefined

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <div className="rounded-2xl border bg-muted/30 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background text-2xl font-semibold text-muted-foreground shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              (organizationName || "?").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{t("organization.logo")}</p>
              <p className="text-xs text-muted-foreground">
                {t("organization.logoDescription")}
              </p>
            </div>
            <ImageCropInput
              cropShape="rect"
              disabled={pending}
              fileName="organization-logo"
              translationPrefix="organization.logoCrop"
              onChange={setLogo}
            />
          </div>
        </div>
      </div>
      <FormField
        label={t("organization.name")}
        error={form.formState.errors.name?.message}
      >
        <Input
          placeholder={t("organization.name")}
          {...form.register("name")}
        />
      </FormField>
      <FormField
        label={t("organization.description")}
        error={form.formState.errors.description?.message}
      >
        <Input
          placeholder={t("organization.description")}
          {...form.register("description")}
        />
      </FormField>
      <FormField
        label={t("organization.contactPerson")}
        error={form.formState.errors.contactPerson?.message}
      >
        <Input
          placeholder={t("organization.contactPerson")}
          {...form.register("contactPerson")}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t("organization.contactEmail")}
          error={form.formState.errors.contactEmail?.message}
        >
          <Input
            type="email"
            placeholder={t("organization.contactEmail")}
            {...form.register("contactEmail")}
          />
        </FormField>
        <FormField
          label={t("organization.contactPhone")}
          error={form.formState.errors.contactPhone?.message}
        >
          <Controller
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <PhoneInput value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="INN" error={form.formState.errors.inn?.message}>
          <Input
            inputMode="numeric"
            placeholder="INN"
            {...form.register("inn")}
            maxLength={9}
          />
        </FormField>
        <FormField
          label={t("organization.address")}
          error={form.formState.errors.address?.message}
        >
          <div className="flex gap-2">
            <Input
              placeholder={t("organization.address")}
              {...form.register("address")}
            />
            <LocationPickerDialog
              address={address}
              value={coordinates}
              onSelect={(nextAddress, nextCoordinates) => {
                form.setValue("address", nextAddress, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                form.setValue("latitude", nextCoordinates.latitude, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                form.setValue("longitude", nextCoordinates.longitude, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
          </div>
          {coordinates ? (
            <p className="font-mono text-xs text-muted-foreground">
              {t("organization.coordinates")}: {coordinates.latitude.toFixed(6)}
              , {coordinates.longitude.toFixed(6)}
            </p>
          ) : null}
        </FormField>
      </div>
      {editing ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4"
            {...form.register("active")}
          />
          {t("organization.active")}
        </label>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {editing ? t("organization.save") : t("organization.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function FormField({
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
