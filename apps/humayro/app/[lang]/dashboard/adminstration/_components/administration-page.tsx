"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  useMe1,
  type ColorDTO,
  type OrganizationDTO,
  type SizeDTO,
} from "@/lib/api"
import { useGetAll6 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import {
  getGetAll3QueryKey,
  useCreate3,
  useDelete3,
  useGetAll3,
  useUpdate4,
} from "@/lib/api/generated/color/color"
import {
  getGetAll1QueryKey,
  useCreate1,
  useDelete1,
  useGetAll1,
  useUpdate1,
} from "@/lib/api/generated/size/size"
import { Input } from "@/components/input"
import { ColorPicker } from "./color-picker"
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
} from "@workspace/ui/components/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export function AdministrationPage() {
  const { t } = useTranslation()
  const meQuery = useMe1({ query: { retry: false } })
  const canManage = meQuery.data?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN"
  )

  if (meQuery.isLoading) {
    return (
      <p className="p-6 text-sm text-muted-foreground md:p-10">
        {t("administration.loading")}
      </p>
    )
  }

  if (!canManage) {
    return (
      <p className="p-6 text-sm text-destructive md:p-10">
        {t("administration.accessDenied")}
      </p>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("administration.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("administration.description")}
        </p>
      </div>
      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors">
            {t("administration.colors.title")}
          </TabsTrigger>
          <TabsTrigger value="sizes">
            {t("administration.sizes.title")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="colors" className="mt-6">
          <ColorsPanel />
        </TabsContent>
        <TabsContent value="sizes" className="mt-6">
          <SizesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ColorsPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const colorsQuery = useGetAll3({ query: { retry: false } })
  const remove = useDelete3()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ColorDTO | null>(null)

  const deleteColor = React.useCallback(
    async (id: number) => {
      try {
        await remove.mutateAsync({ id })
        await queryClient.invalidateQueries({ queryKey: getGetAll3QueryKey() })
        toast.success(t("notifications.deleteSuccess"))
      } catch {
        toast.error(t("notifications.deleteFailed"))
      }
    },
    [queryClient, remove, t]
  )

  const columns = React.useMemo<ColumnDef<ColorDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.name")}
          />
        ),
        cell: ({ row }) => row.getValue<string>("name") || "—",
      },
      {
        accessorKey: "hexCode",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.colors.hex")}
          />
        ),
        cell: ({ row }) => {
          const hexCode = row.getValue<string>("hexCode")
          return (
            <div className="flex items-center gap-2">
              <span
                className="size-6 rounded-full border border-border"
                style={{ backgroundColor: hexCode }}
              />
              <span className="font-mono text-xs">{hexCode || "—"}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.organization")}
          />
        ),
        cell: ({ row }) => row.getValue<string>("organizationName") || "—",
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            onEdit={() => setEditing(row.original)}
            onDelete={
              row.original.id === undefined
                ? undefined
                : () => deleteColor(row.original.id!)
            }
            deleting={remove.isPending}
          />
        ),
      },
    ],
    [deleteColor, remove.isPending, t]
  )

  return (
    <ResourcePanel
      title={t("administration.colors.title")}
      createLabel={t("administration.colors.create")}
      createOpen={createOpen}
      onCreateOpenChange={setCreateOpen}
      createForm={<ColorForm onSaved={() => setCreateOpen(false)} />}
    >
      {colorsQuery.isLoading ? (
        <Message>{t("administration.loading")}</Message>
      ) : colorsQuery.isError ? (
        <Message error>{t("administration.loadFailed")}</Message>
      ) : (
        <DataTable
          columns={columns}
          data={colorsQuery.data ?? []}
          searchColumn="name"
          searchPlaceholder={t("administration.colors.search")}
          emptyMessage={t("administration.empty")}
          labels={getTableLabels(t)}
        />
      )}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("administration.colors.edit")}</DialogTitle>
            <DialogDescription>{editing?.name}</DialogDescription>
          </DialogHeader>
          {editing ? (
            <ColorForm
              key={editing.id}
              color={editing}
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </ResourcePanel>
  )
}

function ColorForm({
  color,
  onSaved,
}: {
  color?: ColorDTO
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreate3()
  const update = useUpdate4()
  const [name, setName] = React.useState(color?.name ?? "")
  const [hexCode, setHexCode] = React.useState(color?.hexCode ?? "#000000")
  const [organizationId, setOrganizationId] = React.useState<number | "">(
    color?.organizationId ?? ""
  )
  const [error, setError] = React.useState(false)
  const valid =
    name.trim().length > 0 &&
    /^#[0-9a-fA-F]{6}$/.test(hexCode) &&
    organizationId !== ""

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid) return setError(true)
    setError(false)

    try {
      const data = {
        name: name.trim(),
        hexCode: hexCode.toUpperCase(),
        organizationId,
      }
      if (color?.id !== undefined)
        await update.mutateAsync({ id: color.id, data })
      else await create.mutateAsync({ data })
      await queryClient.invalidateQueries({ queryKey: getGetAll3QueryKey() })
      toast.success(
        t(color ? "notifications.updateSuccess" : "notifications.createSuccess")
      )
      onSaved()
    } catch {
      setError(true)
      toast.error(
        t(color ? "notifications.updateFailed" : "notifications.createFailed")
      )
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field label={t("administration.name")}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label={t("administration.colors.hex")}>
        <ColorPicker value={hexCode} onChange={setHexCode} disabled={pending} />
      </Field>
      <Field label={t("administration.organization")}>
        <OrganizationSelect
          value={organizationId}
          onChange={setOrganizationId}
          disabled={pending}
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive">
          {t("administration.saveFailed")}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={!valid || pending}>
          {pending ? t("administration.saving") : t("administration.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function SizesPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const sizesQuery = useGetAll1(undefined, { query: { retry: false } })
  const remove = useDelete1()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SizeDTO | null>(null)

  const deleteSize = React.useCallback(
    async (id: number) => {
      try {
        await remove.mutateAsync({ id })
        await queryClient.invalidateQueries({ queryKey: getGetAll1QueryKey() })
        toast.success(t("notifications.deleteSuccess"))
      } catch {
        toast.error(t("notifications.deleteFailed"))
      }
    },
    [queryClient, remove, t]
  )

  const sizes = [...(sizesQuery.data ?? [])].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  )
  const columns = React.useMemo<ColumnDef<SizeDTO>[]>(
    () => [
      {
        accessorKey: "value",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.sizes.value")}
          />
        ),
        cell: ({ row }) => row.getValue<string>("value") || "—",
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.sizes.type")}
          />
        ),
        cell: ({ row }) =>
          t(
            `administration.sizes.types.${row.getValue<string>("type") || "LETTER"}`
          ),
      },
      {
        accessorKey: "sortOrder",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.sizes.sortOrder")}
          />
        ),
        cell: ({ row }) => row.getValue<number>("sortOrder") ?? 0,
      },
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("administration.organization")}
          />
        ),
        cell: ({ row }) => row.getValue<string>("organizationName") || "—",
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            onEdit={() => setEditing(row.original)}
            onDelete={
              row.original.id === undefined
                ? undefined
                : () => deleteSize(row.original.id!)
            }
            deleting={remove.isPending}
          />
        ),
      },
    ],
    [deleteSize, remove.isPending, t]
  )

  return (
    <ResourcePanel
      title={t("administration.sizes.title")}
      createLabel={t("administration.sizes.create")}
      createOpen={createOpen}
      onCreateOpenChange={setCreateOpen}
      createForm={<SizeForm onSaved={() => setCreateOpen(false)} />}
    >
      {sizesQuery.isLoading ? (
        <Message>{t("administration.loading")}</Message>
      ) : sizesQuery.isError ? (
        <Message error>{t("administration.loadFailed")}</Message>
      ) : (
        <DataTable
          columns={columns}
          data={sizes}
          searchColumn="value"
          searchPlaceholder={t("administration.sizes.search")}
          filters={[
            {
              columnId: "type",
              title: t("administration.sizes.type"),
              options: [
                {
                  label: t("administration.sizes.types.LETTER"),
                  value: "LETTER",
                },
                {
                  label: t("administration.sizes.types.NUMBER"),
                  value: "NUMBER",
                },
              ],
            },
          ]}
          emptyMessage={t("administration.empty")}
          labels={getTableLabels(t)}
        />
      )}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("administration.sizes.edit")}</DialogTitle>
            <DialogDescription>{editing?.value}</DialogDescription>
          </DialogHeader>
          {editing ? (
            <SizeForm
              key={editing.id}
              size={editing}
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </ResourcePanel>
  )
}

function SizeForm({ size, onSaved }: { size?: SizeDTO; onSaved: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreate1()
  const update = useUpdate1()
  const [value, setValue] = React.useState(size?.value ?? "")
  const [type, setType] = React.useState<"LETTER" | "NUMBER">(
    size?.type ?? "LETTER"
  )
  const [sortOrder, setSortOrder] = React.useState(size?.sortOrder ?? 0)
  const [organizationId, setOrganizationId] = React.useState<number | "">(
    size?.organizationId ?? ""
  )
  const [error, setError] = React.useState(false)
  const valid = value.trim().length > 0 && organizationId !== ""

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid) return setError(true)
    setError(false)

    try {
      const data = { value: value.trim(), type, sortOrder, organizationId }
      if (size?.id !== undefined)
        await update.mutateAsync({ id: size.id, data })
      else await create.mutateAsync({ data })
      await queryClient.invalidateQueries({ queryKey: getGetAll1QueryKey() })
      toast.success(
        t(size ? "notifications.updateSuccess" : "notifications.createSuccess")
      )
      onSaved()
    } catch {
      setError(true)
      toast.error(
        t(size ? "notifications.updateFailed" : "notifications.createFailed")
      )
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field label={t("administration.sizes.value")}>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Field label={t("administration.sizes.type")}>
        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as "LETTER" | "NUMBER")
          }
          className="h-11 rounded-4xl border border-input bg-input/30 px-4 text-sm outline-none"
        >
          <option value="LETTER">
            {t("administration.sizes.types.LETTER")}
          </option>
          <option value="NUMBER">
            {t("administration.sizes.types.NUMBER")}
          </option>
        </select>
      </Field>
      <Field label={t("administration.sizes.sortOrder")}>
        <Input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.valueAsNumber || 0)}
        />
      </Field>
      <Field label={t("administration.organization")}>
        <OrganizationSelect
          value={organizationId}
          onChange={setOrganizationId}
          disabled={pending}
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive">
          {t("administration.saveFailed")}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={!valid || pending}>
          {pending ? t("administration.saving") : t("administration.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function OrganizationSelect({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean
  onChange: (value: number | "") => void
  value: number | ""
}) {
  const { t } = useTranslation()
  const organizationsQuery = useOrganizations(undefined, {
    query: { retry: false },
  })
  const organizations = (organizationsQuery.data ?? []).filter(
    (organization): organization is OrganizationDTO & { id: number } =>
      organization.id !== undefined
  )

  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value ? Number(event.target.value) : "")
      }
      disabled={disabled || organizationsQuery.isLoading}
      className="h-11 rounded-4xl border border-input bg-input/30 px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled>
        {t("administration.selectOrganization")}
      </option>
      {organizations.map((organization) => (
        <option key={organization.id} value={organization.id}>
          {organization.name}
        </option>
      ))}
    </select>
  )
}

function ResourcePanel({
  children,
  createForm,
  createLabel,
  createOpen,
  onCreateOpenChange,
  title,
}: {
  children: React.ReactNode
  createForm: React.ReactNode
  createLabel: string
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  title: string
}) {
  return (
    <section className="rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button onClick={() => onCreateOpenChange(true)}>{createLabel}</Button>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createLabel}</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          {createForm}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function RowActions({
  deleting,
  onDelete,
  onEdit,
}: {
  deleting: boolean
  onDelete?: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={onEdit}>
        {t("administration.edit")}
      </Button>
      {onDelete ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="destructive">
              {t("administration.delete")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="grid w-64 gap-3">
            <p className="text-sm">{t("administration.deleteConfirm")}</p>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={onDelete}
            >
              {t("administration.delete")}
            </Button>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

function Message({
  children,
  error,
}: {
  children: React.ReactNode
  error?: boolean
}) {
  return (
    <p
      className={`p-6 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
    >
      {children}
    </p>
  )
}

function getTableLabels(
  t: (key: string, options?: Record<string, unknown>) => string
) {
  return {
    resetFilters: t("dashboard.resetFilters"),
    columns: t("dashboard.columns"),
    rowsPerPage: t("dashboard.rowsPerPage"),
    selectedRows: (selected: number, total: number) =>
      t("dashboard.selectedRows", { selected, total }),
    page: (page: number, total: number) => t("dashboard.page", { page, total }),
    previous: t("dashboard.previous"),
    next: t("dashboard.next"),
  }
}
