"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { formatPhoneNumberIntl } from "react-phone-number-input"
import { Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { type OrganizationDTO, useMe1 } from "@/lib/api"
import {
  getGetAll5QueryKey,
  useCreate5,
  useDelete5,
  useGetAll5,
  useUpdate6,
} from "@/lib/api/generated/admin-organization/admin-organization"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Logo } from "@/components/logo"
import { LocationPickerDialog } from "@/components/maps/location-picker-dialog"
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
import { PhoneInput } from "@workspace/ui/components/phone-input"
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

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
  const organizationsQuery = useGetAll5(undefined, {
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
              className="font-medium text-primary hover:underline"
            >
              {row.getValue<string>("name") || "—"}
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
    [t]
  )

  if (meQuery.isLoading || !canManageOrganizations) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <SidebarTrigger className="mb-3" />
          <p className="text-sm font-medium text-primary">
            {t("dashboard.admin")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("dashboard.organizations")}
          </h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>{t("organization.new")}</Button>
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
  const create = useCreate5()
  const update = useUpdate6()
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organization
      ? getOrganizationValues(organization)
      : emptyOrganization,
  })
  const editing = organization?.id !== undefined

  async function submit(values: OrganizationFormValues) {
    const payload = compactOrganizationPayload(values)

    if (editing && organization.id !== undefined) {
      await update.mutateAsync({
        id: organization.id,
        data: { ...payload, active: values.active },
      })
    } else {
      await create.mutateAsync({ data: payload })
    }

    await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
    onComplete()
  }

  const pending = create.isPending || update.isPending

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
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
              onSelect={(address) =>
                form.setValue("address", address, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
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
  const remove = useDelete5()
  const [editOpen, setEditOpen] = useState(false)

  async function deleteOrganization() {
    if (organization.id === undefined) return
    await remove.mutateAsync({ id: organization.id })
    await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("organization.edit")}
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
          <Button variant="destructive" size="sm">
            {t("organization.delete")}
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
