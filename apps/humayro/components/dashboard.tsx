"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatPhoneNumberIntl } from "react-phone-number-input"
import { toast } from "sonner"

import { UserCreateForm } from "@/components/user-create-form"
import {
  useDelete,
  useMe1,
  useUpdate,
  useUploadPhoto,
  type UserDTO,
} from "@/lib/api"
import {
  getGetAll7QueryKey,
  useGetAll7,
} from "@/lib/api/generated/admin-user/admin-user"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  SidebarTrigger
} from "@workspace/ui/components/sidebar"

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { status?: number }

    if (response.status === 403) {
      return t("dashboard.accessDenied")
    }
  }

  return t("dashboard.loadFailed")
}

export function Dashboard({ language }: { language: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const usersQuery = useGetAll7(undefined, {
    query: { enabled: meQuery.isSuccess, retry: false },
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
  const canManageOrganizations = meQuery.data?.roles?.some(
    (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
  )
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

          return phone ? formatPhoneNumberIntl(phone) || phone : "—"
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
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <SidebarTrigger className="mb-3" />
          <p className="text-sm font-medium text-primary">
            {t("dashboard.admin")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>{t("dashboard.addUser")}</Button>
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
            searchColumn="name"
            searchPlaceholder={t("dashboard.search")}
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
      await queryClient.invalidateQueries({ queryKey: getGetAll7QueryKey() })
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
      await queryClient.invalidateQueries({ queryKey: getGetAll7QueryKey() })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("dashboard.edit")}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="destructive" size="sm">
            {t("dashboard.delete")}
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
            <select
              value={gender}
              onChange={(event) =>
                setGender(event.target.value as "" | "MALE" | "FEMALE")
              }
              className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
            >
              <option value="">{t("register.genderUnspecified")}</option>
              <option value="MALE">{t("register.male")}</option>
              <option value="FEMALE">{t("register.female")}</option>
            </select>
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
