"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { useRegister } from "@/lib/api"
import { saveAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Input } from "@/components/input"
import { Button } from "@workspace/ui/components/button"
import { PhoneInput } from "@workspace/ui/components/phone-input"

type FormValues = {
  firstname: string
  lastname: string
  email: string
  phone: string
  gender: "" | "MALE" | "FEMALE"
  password: string
  confirmPassword: string
}

export function RegisterForm({ language }: { language: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const registerMutation = useRegister()
  const setSession = useAuthStore((state) => state.setSession)
  const schema = z
    .object({
      firstname: z.string().min(1, t("register.errors.firstname")),
      lastname: z.string().min(1, t("register.errors.lastname")),
      email: z.string().email(t("register.errors.email")),
      phone: z.string().regex(/^\+998\d{9}$/, t("register.errors.phone")),
      gender: z.enum(["", "MALE", "FEMALE"]),
      password: z.string().min(6, t("register.errors.password")),
      confirmPassword: z.string(),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: t("register.errors.passwordMatch"),
      path: ["confirmPassword"],
    })
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "+998",
      gender: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const session = await registerMutation.mutateAsync({
        data: {
          firstname: values.firstname,
          lastname: values.lastname,
          email: values.email,
          phone: values.phone,
          password: values.password,
          ...(values.gender ? { gender: values.gender } : {}),
        },
      })

      if (!session.accessToken) {
        throw new Error("Missing access token")
      }

      saveAuthToken(session.accessToken)
      setSession(session.user ?? null, values.email)
      router.replace(`/${language}`)
      router.refresh()
    } catch {
      form.setError("root", { message: t("register.errors.failed") })
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("register.firstname")} error={form.formState.errors.firstname?.message}>
          <Input autoComplete="given-name" {...form.register("firstname")} />
        </Field>
        <Field label={t("register.lastname")} error={form.formState.errors.lastname?.message}>
          <Input autoComplete="family-name" {...form.register("lastname")} />
        </Field>
      </div>
      <Field label={t("register.email")} error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label={t("register.phone")} error={form.formState.errors.phone?.message}>
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
          )}
        />
      </Field>
      <Field label={t("register.gender")}>
        <select
          className="flex h-11 w-full rounded-4xl border border-input bg-input/30 px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          {...form.register("gender")}
        >
          <option value="">{t("register.genderUnspecified")}</option>
          <option value="MALE">{t("register.male")}</option>
          <option value="FEMALE">{t("register.female")}</option>
        </select>
      </Field>
      <Field label={t("register.password")} error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field label={t("register.confirmPassword")} error={form.formState.errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      {form.formState.errors.root?.message ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? t("register.submitting") : t("register.submit")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("register.hasAccount")} {" "}
        <Link href={`/${language}/login`} className="font-medium text-primary hover:underline">
          {t("register.signIn")}
        </Link>
      </p>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </label>
  )
}
