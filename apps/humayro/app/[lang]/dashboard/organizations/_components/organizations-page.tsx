"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PencilEdit02Icon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { formatPhoneNumberIntl } from "react-phone-number-input"
import { toast } from "sonner"
import { z } from "zod"

import { useMe1, type OrganizationDTO } from "@/lib/api"
import {
  getGetAll6QueryKey,
  getGetById6QueryKey,
  useCreate6,
  useDelete6,
  useGetAll6,
  useUpdate7,
} from "@/lib/api/generated/admin-organization/admin-organization"
import { useUploadImage } from "@/lib/api/generated/attachment-controller/attachment-controller"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
} from "@workspace/ui/components/data-table"
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
import { ImageCropInput } from "../../profile/_components/image-crop-input"
import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"
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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
    latitude: organization?.latitude,
    longitude: organization?.longitude,
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

export function OrganizationsPage({ language }: { language: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const canManageOrganizations =
    meQuery.data?.roles?.some(
      (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
    ) ?? false
  const organizationsQuery = useGetAll6(undefined, {
    query: { enabled: canManageOrganizations, retry: false },
  })
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (!meQuery.isError) return

    clearAuthToken()
    clearUser()
    router.replace(`/${language}/login`)
  }, [clearUser, language, meQuery.isError, router])

  useEffect(() => {
    if (meQuery.isSuccess && !canManageOrganizations) {
      router.replace(`/${language}/dashboard`)
    }
  }, [canManageOrganizations, language, meQuery.isSuccess, router])

  function signOut() {
    clearAuthToken()
    clearUser()
    queryClient.clear()
    router.replace(`/${language}/login`)
  }

  const userName = [meQuery.data?.firstname, meQuery.data?.lastname]
    .filter(Boolean)
    .join(" ")
  const columns = useMemo<ColumnDef<OrganizationDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("organization.name")}
          />
        ),
        cell: ({ row }) =>
          row.original.id === undefined ? (
            row.getValue<string>("name") || "—"
          ) : (
            <Link
              href={`/${language}/dashboard/organizations/${row.original.id}`}
              className="flex items-center gap-3 font-medium text-primary hover:underline"
            >
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-sm font-semibold text-muted-foreground">
                {row.original.logo?.s3Url ? (
                  <img
                    src={row.original.logo.s3Url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  (row.getValue<string>("name") || "?").slice(0, 1)
                )}
              </span>
              <span>{row.getValue<string>("name") || "—"}</span>
            </Link>
          ),
      },
      {
        id: "contact",
        accessorFn: (organization) =>
          [
            organization.contactPerson,
            organization.contactEmail,
            organization.contactPhone,
          ]
            .filter(Boolean)
            .join(" "),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("organization.contact")}
          />
        ),
        cell: ({ row }) => {
          const { contactPerson, contactEmail, contactPhone } = row.original
          const formattedPhone = contactPhone
            ? formatPhoneNumberIntl(contactPhone) || contactPhone
            : null

          return (
            [contactPerson, contactEmail, formattedPhone]
              .filter(Boolean)
              .join(" ") || "—"
          )
        },
      },
      {
        accessorKey: "inn",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="INN" />
        ),
        cell: ({ row }) => row.getValue<string>("inn") || "—",
      },
      {
        id: "status",
        accessorFn: (organization) => String(organization.active ?? true),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("organization.status")}
          />
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
              ? t("organization.inactive")
              : t("organization.active")}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <OrganizationActions organization={row.original} />,
      },
    ],
    [language, t]
  )

  if (meQuery.isLoading || !canManageOrganizations) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: t("dashboard.organizations") }]}
      />
      <header className="mt-6 flex flex-col items-stretch gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {t("dashboard.admin")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("dashboard.organizations")}
          </h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              {t("organization.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("organization.new")}</DialogTitle>
              <DialogDescription>
                {t("organization.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <OrganizationForm onComplete={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <section className="py-8">
        {organizationsQuery.isLoading ? (
          <p className="text-muted-foreground">{t("organization.loading")}</p>
        ) : organizationsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            {t("organization.loadFailed")}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={organizationsQuery.data ?? []}
            searchColumn="name"
            searchPlaceholder={t("organization.search")}
            emptyMessage={t("organization.empty")}
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
    </div>
  )
}

function OrganizationForm({
  organization,
  onComplete,
}: {
  organization?: OrganizationDTO
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreate6()
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

      await queryClient.invalidateQueries({ queryKey: getGetAll6QueryKey() })
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
              onSelect={(address, coordinates) => {
                form.setValue("address", address, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                form.setValue("latitude", coordinates.latitude, {
                  shouldDirty: true,
                })
                form.setValue("longitude", coordinates.longitude, {
                  shouldDirty: true,
                })
              }}
            />
          </div>
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

function OrganizationActions({
  organization,
}: {
  organization: OrganizationDTO
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const remove = useDelete6()
  const [editOpen, setEditOpen] = useState(false)

  async function deleteOrganization() {
    if (organization.id === undefined) return
    try {
      await remove.mutateAsync({ id: organization.id })
      await queryClient.invalidateQueries({ queryKey: getGetAll6QueryKey() })
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
            aria-label={t("organization.edit")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("organization.edit")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("organization.edit")}</DialogTitle>
            <DialogDescription>{organization.name}</DialogDescription>
          </DialogHeader>
          <OrganizationForm
            organization={organization}
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
            aria-label={t("organization.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("organization.delete")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-64 gap-3">
          <p className="text-sm">{t("organization.deleteConfirm")}</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={remove.isPending}
            onClick={deleteOrganization}
          >
            {t("organization.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
