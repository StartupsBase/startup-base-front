"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { isValidPhoneNumber } from "react-phone-number-input"

import { useLogin } from "@/lib/api"
import { getPostLoginPath } from "@/lib/auth"
import { saveAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { Input } from "@/components/input"
import { GoogleLoginButton } from "@/components/forms/google-login-button"
import { PasswordInput } from "@/components/forms/password-input"
import { Button } from "@workspace/ui/components/button"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

const loginSchema = z
  .object({
    method: z.enum(["email", "phone"]),
    email: z.string().default(""),
    phone: z.string().default(""),
    password: z.string().default(""),
  })
  .superRefine((value, context) => {
    if (value.method === "email") {
      if (!value.email) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "emailRequired",
        })
        return
      }

      if (!z.string().email().safeParse(value.email).success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "emailInvalid",
        })
      }
    }

    if (value.method === "phone") {
      if (!value.phone) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "phoneRequired",
        })
        return
      }

      if (!isValidPhoneNumber(value.phone)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "phoneInvalid",
        })
      }
    }

    if (!value.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "passwordRequired",
      })
      return
    }

    if (value.password.length < 6) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "passwordShort",
      })
    }
  })

type LoginFormValues = z.infer<typeof loginSchema>
type LoginFormInput = z.input<typeof loginSchema>

function getErrorMessage(
  errorKey: string | undefined,
  t: (key: string) => string
) {
  if (!errorKey) {
    return null
  }

  return t(`login.errors.${errorKey}`)
}

function LoginForm() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [method, setMethod] = React.useState<"email" | "phone">("email")
  const setSession = useAuthStore((state) => state.setSession)
  const loginMutation = useLogin()

  const form = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      method: "email",
      email: "",
      phone: "",
      password: "",
    },
  })
  const password = form.watch("password") ?? ""

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)

    try {
      const emailOrPhone =
        values.method === "email" ? values.email : values.phone

      const session = await loginMutation.mutateAsync({
        data: {
          emailOrPhone,
          password: values.password,
        },
      })

      const token = session.accessToken

      if (!token) {
        throw new Error("Missing token")
      }

      saveAuthToken(token)
      setSession(session.user ?? null, emailOrPhone)

      const language = pathname.split("/")[1] ?? "ru"
      const nextPath = new URLSearchParams(window.location.search).get("next")
      const destination =
        nextPath?.startsWith(`/${language}/`) && !nextPath.startsWith("//")
          ? nextPath
          : getPostLoginPath(language, session.user?.roles)

      router.replace(destination)
      router.refresh()
    } catch {
      setSubmitError(t("login.errors.loginFailed"))
    }
  }

  return (
    <Tabs
      value={method}
      onValueChange={(value) => {
        if (value === "email" || value === "phone") {
          setMethod(value)
          form.setValue("method", value)
          form.clearErrors()
          setSubmitError(null)
        }
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">{t("login.emailTab")}</TabsTrigger>
        <TabsTrigger value="phone">{t("login.phoneTab")}</TabsTrigger>
      </TabsList>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <TabsContent value="email" className="mt-0 space-y-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("login.emailLabel")}</span>
            <Input
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              {...form.register("email")}
            />
          </label>
          {form.formState.errors.email?.message ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(form.formState.errors.email.message, t)}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="phone" className="mt-0 space-y-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("login.phoneLabel")}</span>
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  placeholder={t("login.phonePlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
          </label>
          {form.formState.errors.phone?.message ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(form.formState.errors.phone.message, t)}
            </p>
          ) : null}
        </TabsContent>

        <div className="space-y-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">
              {t("login.passwordLabel")}
            </span>
            <PasswordInput
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
              valid={password.length >= 6}
              {...form.register("password")}
            />
          </label>
          {form.formState.errors.password?.message ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(form.formState.errors.password.message, t)}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Link
            href={`/${pathname.split("/")[1] ?? "ru"}/forgot-password`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>

        {submitError ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        <Button
          type="submit"
          className={cn("w-full", loginMutation.isPending && "cursor-wait")}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? t("login.submitting") : t("login.submit")}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("login.orContinue")}
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleLoginButton />
        <p className="text-center text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link
            href={`/${pathname.split("/")[1] ?? "ru"}/register`}
            className="font-medium text-primary hover:underline"
          >
            {t("login.createAccount")}
          </Link>
        </p>
      </form>
    </Tabs>
  )
}

export { LoginForm }
