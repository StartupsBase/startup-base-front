"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { useResetPassword } from "@/lib/api"
import { clearAuthToken } from "@/lib/auth-client"
import { Input } from "@/components/input"
import { Button } from "@workspace/ui/components/button"

type FormValues = {
  phone: string
  code: string
  newPassword: string
  confirmPassword: string
}

export function ResetPasswordForm({
  language,
  phone,
}: {
  language: string
  phone: string
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const resetPassword = useResetPassword()
  const schema = z
    .object({
      phone: z.string().regex(/^\+998\d{9}$/, t("passwordRecovery.errors.phone")),
      code: z.string().min(1, t("passwordRecovery.errors.code")),
      newPassword: z.string().min(6, t("passwordRecovery.errors.password")),
      confirmPassword: z.string(),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      message: t("passwordRecovery.errors.passwordMatch"),
      path: ["confirmPassword"],
    })
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone,
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit({ phone, code, newPassword }: FormValues) {
    try {
      await resetPassword.mutateAsync({
        params: { phone, code, newPassword },
      })
      clearAuthToken()
      router.replace(`/${language}/login`)
    } catch {
      form.setError("root", {
        message: t("passwordRecovery.errors.resetFailed"),
      })
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <label className="block space-y-2">
        <span className="text-sm font-medium">{t("passwordRecovery.phoneLabel")}</span>
        <Input type="tel" autoComplete="tel" {...form.register("phone")} />
      </label>
      {form.formState.errors.phone?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.phone.message}
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium">{t("passwordRecovery.codeLabel")}</span>
        <Input autoComplete="one-time-code" {...form.register("code")} />
      </label>
      {form.formState.errors.code?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.code.message}
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium">{t("passwordRecovery.newPasswordLabel")}</span>
        <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
      </label>
      {form.formState.errors.newPassword?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.newPassword.message}
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium">{t("passwordRecovery.confirmPasswordLabel")}</span>
        <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </label>
      {form.formState.errors.confirmPassword?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.confirmPassword.message}
        </p>
      ) : null}
      {form.formState.errors.root?.message ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={resetPassword.isPending}>
        {resetPassword.isPending
          ? t("passwordRecovery.resettingPassword")
          : t("passwordRecovery.resetPassword")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href={`/${language}/login`} className="font-medium text-primary hover:underline">
          {t("passwordRecovery.backToLogin")}
        </Link>
      </p>
    </form>
  )
}
