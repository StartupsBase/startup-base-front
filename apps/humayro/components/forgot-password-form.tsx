"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { useForgotPassword } from "@/lib/api"
import { Input } from "@/components/input"
import { Button } from "@workspace/ui/components/button"

type FormValues = { phone: string }

export function ForgotPasswordForm({ language }: { language: string }) {
  const router = useRouter()
  const { t } = useTranslation()
  const requestReset = useForgotPassword()
  const schema = z.object({
    phone: z.string().regex(/^\+998\d{9}$/, t("passwordRecovery.errors.phone")),
  })
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+998" },
  })

  async function onSubmit({ phone }: FormValues) {
    try {
      await requestReset.mutateAsync({ params: { phone } })
      router.push(`/${language}/reset-password?phone=${encodeURIComponent(phone)}`)
    } catch {
      form.setError("root", {
        message: t("passwordRecovery.errors.sendFailed"),
      })
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <label className="block space-y-2">
        <span className="text-sm font-medium">{t("passwordRecovery.phoneLabel")}</span>
        <Input
          type="tel"
          autoComplete="tel"
          placeholder="+998901234567"
          {...form.register("phone")}
        />
      </label>
      {form.formState.errors.phone?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.phone.message}
        </p>
      ) : null}
      {form.formState.errors.root?.message ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={requestReset.isPending}>
        {requestReset.isPending
          ? t("passwordRecovery.sendingCode")
          : t("passwordRecovery.sendCode")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("passwordRecovery.rememberedPassword")} {" "}
        <Link href={`/${language}/login`} className="font-medium text-primary hover:underline">
          {t("passwordRecovery.signIn")}
        </Link>
      </p>
    </form>
  )
}
