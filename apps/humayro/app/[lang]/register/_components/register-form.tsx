"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { GoogleLoginButton } from "@/components/forms/google-login-button"
import { PasswordInput } from "@/components/forms/password-input"
import { Input } from "@/components/input"
import { useRegister } from "@/lib/api"
import { saveAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Button } from "@workspace/ui/components/button"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

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
  const password = form.watch("password")
  const confirmPassword = form.watch("confirmPassword")

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
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Field
          label={t("register.firstname")}
          error={form.formState.errors.firstname?.message}
        >
          <Input
            autoComplete="given-name"
            className={controlClassName}
            {...form.register("firstname")}
          />
        </Field>
        <Field
          label={t("register.lastname")}
          error={form.formState.errors.lastname?.message}
        >
          <Input
            autoComplete="family-name"
            className={controlClassName}
            {...form.register("lastname")}
          />
        </Field>
      </div>
      <Field
        label={t("register.email")}
        error={form.formState.errors.email?.message}
      >
        <Input
          type="email"
          autoComplete="email"
          className={controlClassName}
          {...form.register("email")}
        />
      </Field>
      <Field
        label={t("register.phone")}
        error={form.formState.errors.phone?.message}
      >
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              className={controlClassName}
            />
          )}
        />
      </Field>
      <Field label={t("register.gender")}>
        <Controller
          control={form.control}
          name="gender"
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger onBlur={field.onBlur} className={controlClassName}>
                <SelectValue placeholder={t("register.genderUnspecified")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t("register.male")}</SelectItem>
                <SelectItem value="FEMALE">{t("register.female")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field
        label={t("register.password")}
        error={form.formState.errors.password?.message}
      >
        <PasswordInput
          valid={password.length >= 6}
          autoComplete="new-password"
          className={controlClassName}
          {...form.register("password")}
        />
      </Field>
      <Field
        label={t("register.confirmPassword")}
        error={form.formState.errors.confirmPassword?.message}
      >
        <PasswordInput
          valid={confirmPassword.length >= 6 && confirmPassword === password}
          autoComplete="new-password"
          className={controlClassName}
          {...form.register("confirmPassword")}
        />
      </Field>
      {form.formState.errors.root?.message ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-5 text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button
        className="h-12 w-full rounded-2xl bg-[#08bfa4] text-sm font-bold text-[#00251f] shadow-[0_12px_30px_rgba(8,191,164,.18)] hover:bg-[#20cdb4] hover:shadow-[0_14px_34px_rgba(8,191,164,.24)] focus-visible:ring-[#54dbc8]/35 dark:bg-[#08bfa4] dark:text-[#001b17] dark:hover:bg-[#28d2ba]"
        type="submit"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending
          ? t("register.submitting")
          : t("register.submit")}
      </Button>
      <p className="pt-0.5 text-center text-sm text-muted-foreground">
        {t("register.hasAccount")}{" "}
        <Link
          href={`/${language}/login`}
          className="font-semibold text-primary underline-offset-4 hover:underline dark:text-[#3bd6c0]"
        >
          {t("register.signIn")}
        </Link>
      </p>
    </form>
  )
}

const controlClassName =
  "h-12 w-full rounded-2xl border-border/80 bg-background/55 px-4 text-sm shadow-none transition-[border-color,background-color,box-shadow] hover:border-primary/25 focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10 dark:border-white/12 dark:bg-white/[0.045] dark:hover:border-[#49cdb9]/30 dark:focus-visible:border-[#49cdb9]/65 dark:focus-visible:bg-white/[0.065] dark:focus-visible:ring-[#20cdb4]/12"

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
    <label className="group/field block space-y-2">
      <span className="text-sm font-semibold text-foreground/85 transition-colors group-focus-within/field:text-primary dark:text-white/80 dark:group-focus-within/field:text-[#5ee3cf]">
        {label}
      </span>
      {children}
      {error ? (
        <p className="text-xs leading-5 text-destructive">{error}</p>
      ) : null}
    </label>
  )
}
