"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCreate } from "@/lib/api"
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
}: {
  onComplete: () => void
  organizationId?: number
}) {
  const { t } = useTranslation()
  const createUser = useCreate()
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
      await createUser.mutateAsync({
        data:
          organizationId === undefined ? values : { ...values, organizationId },
      })
      await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() })
      toast.success(t("notifications.createSuccess"))
      onComplete()
    } catch {
      toast.error(t("notifications.createFailed"))
    }
  }
  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
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
        render={({ field }) => (
          <PhoneInput value={field.value} onChange={field.onChange} />
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
            <Select value={field.value} onValueChange={field.onChange}>
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
      <Button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create user"}
      </Button>
    </form>
  )
}
