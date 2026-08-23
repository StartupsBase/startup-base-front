"use client"

import { PencilEdit02Icon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { UserCreateForm } from "./user-create-form"
import {
  useDelete,
  useMe1,
  useUpdate,
  useUploadPhoto,
  type UserDTO,
} from "@/lib/api"
import {
  getGetAllQueryKey,
  useGetAll,
} from "@/lib/api/generated/user-controller/user-controller"
import { useGetAll7 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import { useInfiniteBranches } from "@/hooks/use-infinite-directory-query"
import { clearAuthToken } from "@/lib/auth-client"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { useHasAuthToken } from "@/lib/use-auth-token"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
const ALL_ORGANIZATIONS = "__all_organizations__"
const ALL_BRANCHES = "__all_branches__"
const GENDER_UNSPECIFIED = "__gender_unspecified__"

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { status?: number }

    if (response.status === 403) {
      return t("dashboard.accessDenied")
    }
  }

  return t("dashboard.loadFailed")
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function Dashboard({ language }: { language: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const hasAuthToken = useHasAuthToken()
  const meQuery = useMe1({ query: { retry: false, enabled: hasAuthToken } })
  const [search, setSearch] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [branchId, setBranchId] = useState("")
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const selectedOrganizationId = organizationId
    ? Number(organizationId)
    : undefined
  const selectedBranchId = branchId ? Number(branchId) : undefined
  const organizationsQuery = useOrganizations(undefined, {
    query: { enabled: meQuery.isSuccess, retry: false },
  })
  const branchesQuery = useInfiniteBranches(
    { organizationId: selectedOrganizationId, size: 100 },
    { query: { enabled: meQuery.isSuccess, retry: false } }
  )
  const usersQuery = useGetAll(
    {
      search: debouncedSearch || undefined,
      organizationId: selectedOrganizationId,
      branchId: selectedBranchId,
    },
    {
      query: { enabled: meQuery.isSuccess, retry: false },
    }
  )
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

  function signOut() {
    clearAuthToken()
    clearUser()
    queryClient.clear()
    router.replace(`/${language}/login`)
  }

  const users = usersQuery.data?.content ?? []
  const userName = [meQuery.data?.firstname, meQuery.data?.lastname]
    .filter(Boolean)
    .join(" ")
  const columns = useMemo<ColumnDef<UserDTO>[]>(
    () => [
      {
        id: "name",
        accessorFn: (user) =>
          [user.firstname, user.lastname].filter(Boolean).join(" "),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.name")} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.photo?.s3Url ? (
              <img
                src={row.original.photo.s3Url}
                alt=""
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {(row.getValue<string>("name") || "?").slice(0, 1)}
              </span>
            )}
            <span>{row.getValue<string>("name") || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.email")} />
        ),
        cell: ({ row }) => row.getValue<string>("email") || "—",
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.phone")} />
        ),
        cell: ({ row }) => {
          const phone = row.getValue<string>("phone")

          return phone ? formatPhoneNumberInternal(phone) : "—"
        },
      },
      {
        id: "roles",
        accessorFn: (user) => user.roles?.join(" ") ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dashboard.roles")} />
        ),
        cell: ({ row }) =>
          row.getValue<string>("roles") || t("dashboard.customer"),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <UserActions user={row.original} />,
      },
    ],
    [t]
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col items-stretch gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {t("dashboard.admin")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              {t("dashboard.addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dashboard.addUser")}</DialogTitle>
              <DialogDescription>
                {t("dashboard.addUserDescription")}
              </DialogDescription>
            </DialogHeader>
            <UserCreateForm onComplete={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <section className="py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("dashboard.search")}
            className="w-full sm:w-64"
          />
          <Select
            value={organizationId || ALL_ORGANIZATIONS}
            onValueChange={(nextValue) => {
              setOrganizationId(
                nextValue === ALL_ORGANIZATIONS ? "" : nextValue
              )
              setBranchId("")
            }}
            disabled={organizationsQuery.isLoading}
          >
            <SelectTrigger
              aria-label={t("dashboard.allOrganizations")}
              className="h-11 w-full sm:w-auto sm:max-w-64"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ORGANIZATIONS}>
                {t("dashboard.allOrganizations")}
              </SelectItem>
              {organizationsQuery.data?.map((organization) =>
                organization.id !== undefined ? (
                  <SelectItem
                    key={organization.id}
                    value={String(organization.id)}
                  >
                    {organization.name}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
          <Select
            value={branchId || ALL_BRANCHES}
            onValueChange={(nextValue) =>
              setBranchId(nextValue === ALL_BRANCHES ? "" : nextValue)
            }
            disabled={branchesQuery.isLoading}
          >
            <SelectTrigger
              aria-label={t("dashboard.allBranches")}
              className="h-11 w-full sm:w-auto sm:max-w-64"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>
                {t("dashboard.allBranches")}
              </SelectItem>
              {branchesQuery.data?.content?.map((branch) =>
                branch.id !== undefined ? (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
        </div>
        {usersQuery.isLoading || meQuery.isLoading ? (
          <p className="text-muted-foreground">{t("dashboard.loadingUsers")}</p>
        ) : usersQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            {getErrorMessage(usersQuery.error, t)}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            filters={[
              {
                columnId: "roles",
                title: t("dashboard.roles"),
                options: [
                  { label: "Admin", value: "ADMIN" },
                  { label: t("dashboard.customer"), value: "USER" },
                ],
              },
            ]}
            enableRowSelection
            emptyMessage={t("dashboard.empty")}
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

function UserActions({ user }: { user: UserDTO }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const updateUser = useUpdate()
  const deleteUser = useDelete()
  const uploadPhoto = useUploadPhoto()
  const [open, setOpen] = useState(false)
  const [firstname, setFirstname] = useState(user.firstname ?? "")
  const [lastname, setLastname] = useState(user.lastname ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [gender, setGender] = useState<"" | "MALE" | "FEMALE">(
    user.gender ?? ""
  )
  const [file, setFile] = useState<File | null>(null)

  async function save() {
    if (user.id === undefined) return
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: { firstname, lastname, phone, ...(gender ? { gender } : {}) },
      })
      if (file) {
        await uploadPhoto.mutateAsync({ id: user.id, data: { file } })
      }
      await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() })
      toast.success(t("notifications.updateSuccess"))
      setOpen(false)
    } catch {
      toast.error(t("notifications.updateFailed"))
    }
  }

  async function remove() {
    if (user.id === undefined) return
    try {
      await deleteUser.mutateAsync({ id: user.id })
      await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
        aria-label={t("dashboard.edit")}
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} className="size-5 lg:hidden" />
        <span className="hidden lg:inline">{t("dashboard.edit")}</span>
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("dashboard.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("dashboard.delete")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <p className="text-sm">{t("dashboard.deleteConfirm")}</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteUser.isPending}
            onClick={remove}
          >
            {t("dashboard.delete")}
          </Button>
        </PopoverContent>
      </Popover>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.editUser")}</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Input
              value={firstname}
              onChange={(event) => setFirstname(event.target.value)}
              placeholder={t("register.firstname")}
            />
            <Input
              value={lastname}
              onChange={(event) => setLastname(event.target.value)}
              placeholder={t("register.lastname")}
            />
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t("register.phone")}
            />
            <Select
              value={gender || GENDER_UNSPECIFIED}
              onValueChange={(nextValue) =>
                setGender(
                  nextValue === GENDER_UNSPECIFIED
                    ? ""
                    : (nextValue as "MALE" | "FEMALE")
                )
              }
            >
              <SelectTrigger
                aria-label={t("register.genderUnspecified")}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GENDER_UNSPECIFIED}>
                  {t("register.genderUnspecified")}
                </SelectItem>
                <SelectItem value="MALE">{t("register.male")}</SelectItem>
                <SelectItem value="FEMALE">{t("register.female")}</SelectItem>
              </SelectContent>
            </Select>
            <label className="text-sm font-medium">
              {t("dashboard.profilePhoto")}
              <Input
                type="file"
                accept="image/*"
                className="mt-2"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={updateUser.isPending}>
              {t("dashboard.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
