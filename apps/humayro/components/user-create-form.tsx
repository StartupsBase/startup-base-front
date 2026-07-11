"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCreate } from "@/lib/api"
import { getGetAll6QueryKey } from "@/lib/api/generated/admin-user/admin-user"
import { useGetAll5 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/forms/password-input"

const schema = z.object({
  firstname: z.string().min(1), lastname: z.string().min(1), email: z.string().email(),
  password: z.string().min(6), phone: z.string().regex(/^\+998\d{9}$/),
  age: z.coerce.number().int().min(0).optional(), gender: z.enum(["MALE", "FEMALE"]),
  organizationId: z.coerce.number().int().positive().optional(),
})
type Values = z.infer<typeof schema>
type Inputs = z.input<typeof schema>

export function UserCreateForm({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation()
  const createUser = useCreate()
  const organizations = useOrganizations()
  const queryClient = useQueryClient()
  const form = useForm<Inputs, unknown, Values>({ resolver: zodResolver(schema), defaultValues: { firstname: "", lastname: "", email: "", password: "", phone: "+998", age: 0, gender: "MALE" } })
  const password = form.watch("password")
  async function submit(values: Values) {
    try {
      await createUser.mutateAsync({ data: values })
      await queryClient.invalidateQueries({ queryKey: getGetAll6QueryKey() })
      toast.success(t("notifications.createSuccess"))
      onComplete()
    } catch {
      toast.error(t("notifications.createFailed"))
    }
  }
  return <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
    <div className="grid grid-cols-2 gap-3"><Input placeholder="First name" {...form.register("firstname")} /><Input placeholder="Last name" {...form.register("lastname")} /></div>
    <Input type="email" placeholder="Email" {...form.register("email")} />
    <PasswordInput valid={password.length >= 6} placeholder="Password" {...form.register("password")} />
    <Controller control={form.control} name="phone" render={({ field }) => <PhoneInput value={field.value} onChange={field.onChange} />} />
    <div className="grid grid-cols-2 gap-3"><Input type="number" min="0" placeholder="Age" {...form.register("age")} /><select className="rounded-4xl border border-input bg-input/30 px-3 text-sm" {...form.register("gender")}><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
    <select className="h-10 rounded-4xl border border-input bg-input/30 px-3 text-sm" {...form.register("organizationId")}><option value="">No organization</option>{organizations.data?.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
    <Button type="submit" disabled={createUser.isPending}>{createUser.isPending ? "Creating..." : "Create user"}</Button>
  </form>
}
