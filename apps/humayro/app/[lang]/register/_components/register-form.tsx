"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

type FormValues = {
  firstname: string
  lastname: string
  email: string
  phone: string
  gender: "" | "MALE" | "FEMALE"
  password: string
  confirmPassword: string
}


const controlClassName =
  "h-14 min-h-14 w-full rounded-2xl border-border/80 bg-background/55 px-4 text-base shadow-none transition-[border-color,background-color,box-shadow] hover:border-primary/25 focus-visible:border-primary/60 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10 dark:border-white/12 dark:bg-white/[0.045] dark:hover:border-[#49cdb9]/30 dark:focus-visible:border-[#49cdb9]/65 dark:focus-visible:bg-white/[0.065] dark:focus-visible:ring-[#20cdb4]/12"


export function RegisterForm({ language }: { language: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [contactMethod, setContactMethod] = useState<"phone" | "email">("phone")
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
      phone: "",
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
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Field
          id="register-firstname"
          label={t("register.firstname")}
          error={form.formState.errors.firstname?.message}
        >
          <Input
            autoComplete="given-name"
            className={controlClassName}
            id="register-firstname"
            placeholder={t("register.firstnamePlaceholder")}
            aria-invalid={!!form.formState.errors.firstname}
            aria-describedby={form.formState.errors.firstname ? "register-firstname-error" : undefined}
            {...form.register("firstname")}
          />
        </Field>
        <Field
          id="register-lastname"
          label={t("register.lastname")}
          error={form.formState.errors.lastname?.message}
        >
          <Input
            autoComplete="family-name"
            className={controlClassName}
            id="register-lastname"
            placeholder={t("register.lastnamePlaceholder")}
            aria-invalid={!!form.formState.errors.lastname}
            aria-describedby={form.formState.errors.lastname ? "register-lastname-error" : undefined}
            {...form.register("lastname")}
          />
        </Field>
      </div>
      <section aria-labelledby="register-contact-heading" className="space-y-4">
        <div className="space-y-2">
          <h2 id="register-contact-heading" className="text-lg font-semibold leading-7">
            {t("register.continueWithContact")}
          </h2>
          <p id="register-contact-hint" className="text-sm leading-6 text-muted-foreground">
            {t("register.contactHint")}
          </p>
        </div>
        <Tabs
          value={contactMethod}
          onValueChange={(value) => {
            if (value === "phone" || value === "email") {
              setContactMethod(value)
            }
          }}
          className="gap-5"
        >
          <TabsList
            aria-labelledby="register-contact-heading"
            aria-describedby="register-contact-hint"
            className="grid w-full grid-cols-2 rounded-2xl p-1.5 group-data-horizontal/tabs:h-16"
          >
            <TabsTrigger value="phone" className="min-h-12 rounded-xl px-2 text-base whitespace-normal">
              {t("register.phone")}
            </TabsTrigger>
            <TabsTrigger value="email" className="min-h-12 rounded-xl px-2 text-base whitespace-normal">
              {t("register.email")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={contactMethod} className="space-y-5">
            {(contactMethod === "phone" ? ["phone", "email"] as const : ["email", "phone"] as const).map((contact) => (
              <Field
                key={contact}
                id={`register-${contact}`}
                label={t(`register.${contact}`)}
                error={form.formState.errors[contact]?.message}
              >
                {contact === "phone" ? (
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        id="register-phone"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        autoComplete="tel"
                        placeholder={t("register.phonePlaceholder")}
                        aria-invalid={!!form.formState.errors.phone}
                        aria-describedby={form.formState.errors.phone ? "register-phone-error" : undefined}
                        className={`${controlClassName} [&_.PhoneInputInput]:text-base`}
                      />
                    )}
                  />
                ) : (
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("register.emailPlaceholder")}
                    aria-invalid={!!form.formState.errors.email}
                    aria-describedby={form.formState.errors.email ? "register-email-error" : undefined}
                    className={controlClassName}
                    {...form.register("email")}
                  />
                )}
              </Field>
            ))}
          </TabsContent>
        </Tabs>
      </section>
      <Field id="register-gender" label={t("register.gender")}>
        <Controller
          control={form.control}
          name="gender"
          render={({ field }) => (
            <Select
              noOptions={t("select.noGenderOptions")}
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="register-gender" onBlur={field.onBlur} className={controlClassName}>
                <SelectValue placeholder={t("register.genderPlaceholder")} />
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
        id="register-password"
          label={t("register.password")}
        error={form.formState.errors.password?.message}
      >
        <PasswordInput
          valid={password.length >= 6}
          autoComplete="new-password"
          className={`${controlClassName} pr-20`}
          id="register-password"
            placeholder={t("register.passwordPlaceholder")}
            aria-invalid={!!form.formState.errors.password}
            aria-describedby={form.formState.errors.password ? "register-password-error" : undefined}
            {...form.register("password")}
        />
      </Field>
      <Field
        id="register-confirmPassword"
          label={t("register.confirmPassword")}
        error={form.formState.errors.confirmPassword?.message}
      >
        <PasswordInput
          valid={confirmPassword.length >= 6 && confirmPassword === password}
          autoComplete="new-password"
          className={`${controlClassName} pr-20`}
          id="register-confirmPassword"
            placeholder={t("register.confirmPasswordPlaceholder")}
            aria-invalid={!!form.formState.errors.confirmPassword}
            aria-describedby={form.formState.errors.confirmPassword ? "register-confirmPassword-error" : undefined}
            {...form.register("confirmPassword")}
        />
      </Field>
      {form.formState.errors.root?.message ? (
        <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-5 text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button
        className="h-14 w-full rounded-2xl bg-[#08bfa4] text-base font-bold text-[#00251f] shadow-[0_12px_30px_rgba(8,191,164,.18)] hover:bg-[#20cdb4] hover:shadow-[0_14px_34px_rgba(8,191,164,.24)] focus-visible:ring-[#54dbc8]/35 dark:bg-[#08bfa4] dark:text-[#001b17] dark:hover:bg-[#28d2ba]"
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


function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="group/field min-w-0 space-y-2.5">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground/85 transition-colors group-focus-within/field:text-primary dark:text-white/80 dark:group-focus-within/field:text-[#5ee3cf]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm leading-5 text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
