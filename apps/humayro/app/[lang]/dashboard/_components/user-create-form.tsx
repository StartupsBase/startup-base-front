"use client"

import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCreate } from "@/lib/api"
import {
  getGetAll11QueryKey,
  useGrantRole,
} from "@/lib/api/generated/admin-user/admin-user"
import { ORGANIZATION_USER_ROLES, UserRoleFields } from "./user-role-fields"
import { getGetAllQueryKey } from "@/lib/api/generated/user-controller/user-controller"
import { useGetAll7 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { PasswordInput } from "@/components/forms/password-input"

const NO_ORGANIZATION = "__no_organization__"

const schema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().regex(/^\+998\d{9}$/),
  age: z.coerce.number().int().min(0).optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  organizationId: z.coerce.number().int().positive().optional(),
})

type Values = z.infer<typeof schema>
type Inputs = z.input<typeof schema>

export function UserCreateForm({
  onComplete,
  organizationId,
  showRoles = false,
}: {
  onComplete: () => void
  organizationId?: number
  showRoles?: boolean
}) {
  const { t } = useTranslation()
  const createUser = useCreate()
  const grantRole = useGrantRole()
  const [roles, setRoles] = useState<string[]>([])
  const organizations = useOrganizations()
  const queryClient = useQueryClient()
  const form = useForm<Inputs, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      phone: "+998",
      age: 0,
      gender: "MALE",
      organizationId,
    },
  })
  const password = useWatch({ control: form.control, name: "password" }) ?? ""
  async function submit(values: Values) {
    try {
      const user = await createUser.mutateAsync({
        data:
          organizationId === undefined ? values : { ...values, organizationId },
      })
      let rolesFailed = false
      if (showRoles) {
        try {
          for (const roleName of ORGANIZATION_USER_ROLES) {
            if (!roles.includes(roleName) || user.roles?.includes(roleName))
              continue
            if (user.id === undefined) throw new Error("Created user has no ID")
            await grantRole.mutateAsync({ id: user.id, roleName })
          }
        } catch {
          rolesFailed = true
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAll11QueryKey() }),
      ])
      if (rolesFailed) {
        toast.warning(t("dashboard.createdRolesFailed"))
      } else {
        toast.success(t("notifications.createSuccess"))
      }
      onComplete()
    } catch {
      toast.error(t("notifications.createFailed"))
    }
  }
  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
      <fieldset className="grid gap-3" disabled={form.formState.isSubmitting}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="First name" {...form.register("firstname")} />
          <Input placeholder="Last name" {...form.register("lastname")} />
        </div>
        <Input type="email" placeholder="Email" {...form.register("email")} />
        <PasswordInput
          valid={password.length >= 6}
          placeholder="Password"
          {...form.register("password")}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <PhoneInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              autoComplete="tel"
              aria-label={t("register.phone")}
              placeholder={t("register.phonePlaceholder")}
              aria-invalid={fieldState.invalid}
            />
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            min="0"
            placeholder="Age"
            {...form.register("age")}
          />
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <Select
                noOptions={t("select.noGenderOptions")}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  ref={field.ref}
                  aria-label={t("register.gender")}
                  className="w-full"
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{t("register.male")}</SelectItem>
                  <SelectItem value="FEMALE">{t("register.female")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {organizationId === undefined ? (
          <Controller
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <Select
                empty={!organizations.data?.some((org) => org.id !== undefined)}
                noOptions={t("select.noOrganizations")}
                value={
                  field.value === undefined || field.value === ""
                    ? NO_ORGANIZATION
                    : String(field.value)
                }
                onValueChange={(nextValue) =>
                  field.onChange(
                    nextValue === NO_ORGANIZATION ? undefined : nextValue
                  )
                }
              >
                <SelectTrigger
                  ref={field.ref}
                  aria-label={t("dashboard.organizations")}
                  className="h-10 w-full"
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ORGANIZATION}>
                    {t("dashboard.allOrganizations")}
                  </SelectItem>
                  {organizations.data?.map((org) =>
                    org.id !== undefined ? (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
            )}
          />
        ) : null}
        {showRoles ? (
          <UserRoleFields
            value={roles}
            onChange={setRoles}
            disabled={form.formState.isSubmitting}
          />
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create user"}
        </Button>
      </fieldset>
    </form>
  )
}
