"use client"

import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { type UserDTO } from "@/lib/api"
import {
  getGetAllQueryKey,
  getGetByIdQueryKey,
  useUpdate,
} from "@/lib/api/generated/user-controller/user-controller"
import {
  getGetAll11QueryKey,
  useGrantRole,
  useRevokeRole,
} from "@/lib/api/generated/admin-user/admin-user"
import { getMe1QueryKey } from "@/lib/api/generated/auth/auth"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ORGANIZATION_USER_ROLES, UserRoleFields } from "./user-role-fields"

const schema = z.object({
  firstname: z.string().trim().min(1, "profile.errors.required"),
  lastname: z.string().trim().min(1, "profile.errors.required"),
  phone: z.string().regex(/^\+998\d{9}$/, "profile.errors.phone"),
  age: z.union([
    z.literal(""),
    z.number().int("profile.errors.age").nonnegative("profile.errors.age"),
  ]),
  gender: z.enum(["", "MALE", "FEMALE"]),
  roles: z.array(z.string()),
})

type Values = z.infer<typeof schema>

function getValues(user: UserDTO): Values {
  return {
    firstname: user.firstname ?? "",
    lastname: user.lastname ?? "",
    phone: user.phone ?? "+998",
    age: user.age ?? "",
    gender: user.gender ?? "",
    roles: user.roles ?? [],
  }
}

export function UserEditAction({ user }: { user: UserDTO }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const savedRoles = useRef(user.roles ?? [])
  const updateUser = useUpdate()
  const grantRole = useGrantRole()
  const revokeRole = useRevokeRole()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: getValues(user),
  })
  const { errors, isSubmitting } = form.formState

  function changeOpen(nextOpen: boolean) {
    if (isSubmitting) return
    if (nextOpen) {
      form.reset(getValues(user))
      savedRoles.current = user.roles ?? []
    }
    setOpen(nextOpen)
  }

  async function save(values: Values) {
    if (user.id === undefined) return
    let infoSaved = false
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          firstname: values.firstname,
          lastname: values.lastname,
          phone: values.phone,
          ...(values.age !== "" ? { age: values.age } : {}),
          ...(values.gender ? { gender: values.gender } : {}),
        },
      })
      infoSaved = true
      for (const roleName of ORGANIZATION_USER_ROLES) {
        const selected = values.roles.includes(roleName)
        if (selected === savedRoles.current.includes(roleName)) continue
        if (selected) {
          await grantRole.mutateAsync({ id: user.id, roleName })
          savedRoles.current = [...savedRoles.current, roleName]
        } else {
          await revokeRole.mutateAsync({ id: user.id, roleName })
          savedRoles.current = savedRoles.current.filter(
            (role) => role !== roleName
          )
        }
      }
      toast.success(t("notifications.updateSuccess"))
      setOpen(false)
    } catch {
      toast.error(
        t(
          infoSaved
            ? "dashboard.rolesUpdateFailed"
            : "notifications.updateFailed"
        )
      )
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAll11QueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: getGetByIdQueryKey(user.id),
        }),
        queryClient.invalidateQueries({ queryKey: getMe1QueryKey() }),
      ])
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={user.id === undefined}>
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
          {t("dashboard.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dashboard.editUser")}</DialogTitle>
          <DialogDescription>
            {user.email || t("dashboard.editUser")}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <fieldset className="grid gap-4" disabled={isSubmitting}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["firstname", "lastname"] as const).map((name) => (
                <label key={name} className="grid gap-2 text-sm font-medium">
                  {t(`profile.${name}`)}
                  <Input
                    {...form.register(name)}
                    aria-invalid={!!errors[name]}
                  />
                  {errors[name]?.message ? (
                    <span role="alert" className="text-destructive">
                      {t(errors[name].message)}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-medium">
              {t("profile.phone")}
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    autoComplete="tel"
                    aria-label={t("profile.phone")}
                    aria-invalid={!!errors.phone}
                  />
                )}
              />
              {errors.phone?.message ? (
                <span role="alert" className="text-destructive">
                  {t(errors.phone.message)}
                </span>
              ) : null}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                {t("profile.age")}
                <Input
                  type="number"
                  min={0}
                  step={1}
                  required={user.age != null}
                  aria-invalid={!!errors.age}
                  {...form.register("age", {
                    setValueAs: (value: string) =>
                      value === "" ? "" : Number(value),
                  })}
                />
                {errors.age ? (
                  <span role="alert" className="text-destructive">
                    {t("profile.errors.age")}
                  </span>
                ) : null}
              </label>
              <div className="grid content-start gap-2 text-sm font-medium">
                <span>{t("profile.gender")}</span>
                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <Select
                      value={field.value || "unspecified"}
                      onValueChange={(value) =>
                        field.onChange(value === "unspecified" ? "" : value)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        ref={field.ref}
                        onBlur={field.onBlur}
                        className="w-full"
                        aria-label={t("profile.gender")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {!user.gender ? (
                          <SelectItem value="unspecified">
                            {t("profile.genderUnspecified")}
                          </SelectItem>
                        ) : null}
                        <SelectItem value="MALE">
                          {t("profile.male")}
                        </SelectItem>
                        <SelectItem value="FEMALE">
                          {t("profile.female")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <Controller
              control={form.control}
              name="roles"
              render={({ field }) => (
                <UserRoleFields
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </fieldset>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => changeOpen(false)}
            >
              {t("profile.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t(isSubmitting ? "profile.saving" : "dashboard.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
