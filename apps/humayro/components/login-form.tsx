"use client"

import * as React from "react"
import Cookies from "js-cookie"
import { usePathname, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { authTokenCookieName } from "@/lib/auth"
import { http } from "@/lib/http"
import { PhoneInput } from "@/components/phone-input"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

const inputClassName =
  "flex h-11 w-full rounded-4xl border border-input bg-input/30 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/50"

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

      if (value.phone.length !== 9) {
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

type LoginResponse =
  | string
  | {
      token?: string
      accessToken?: string
      data?: {
        token?: string
        accessToken?: string
      }
    }

function getErrorMessage(
  errorKey: string | undefined,
  t: (key: string) => string
) {
  if (!errorKey) {
    return null
  }

  return t(`login.errors.${errorKey}`)
}

function getTokenFromResponse(data: LoginResponse) {
  if (typeof data === "string") {
    return data
  }

  return data.accessToken ?? data.token ?? data.data?.accessToken ?? data.data?.token
}

function LoginForm() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [method, setMethod] = React.useState<"email" | "phone">("email")

  const form = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      method: "email",
      email: "",
      phone: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)

    try {
      const emailOrPhone =
        values.method === "email"
          ? values.email
          : `+998${values.phone}`

      const response = await http.post<LoginResponse>("/auth/login", {
        emailOrPhone,
        password: values.password,
      })

      const token = getTokenFromResponse(response.data)

      if (!token) {
        throw new Error("Missing token")
      }

      Cookies.set(authTokenCookieName, token, {
        sameSite: "lax",
        expires: 7,
      })

      router.replace(`/${pathname.split("/")[1] ?? "ru"}`)
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

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <TabsContent value="email" className="mt-0 space-y-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t("login.emailLabel")}</span>
            <input
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              className={inputClassName}
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
            <span className="text-sm font-medium">{t("login.passwordLabel")}</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
              className={inputClassName}
              {...form.register("password")}
            />
          </label>
          {form.formState.errors.password?.message ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(form.formState.errors.password.message, t)}
            </p>
          ) : null}
        </div>

        <p className="text-muted-foreground text-xs">{t("login.helper")}</p>

        {submitError ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        <Button
          type="submit"
          className={cn("w-full", form.formState.isSubmitting && "cursor-wait")}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>
    </Tabs>
  )
}

export { LoginForm }
