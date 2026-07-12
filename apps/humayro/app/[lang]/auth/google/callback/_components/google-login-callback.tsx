"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

import { useGoogleCallback } from "@/lib/api"
import { saveAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { googleReturnPathKey } from "@/lib/auth"

export function GoogleLoginCallback({ language }: { language: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)
  const handledToken = useRef<string | null>(null)
  const code = searchParams.get("code") ?? ""
  const callbackQuery = useGoogleCallback(
    { code },
    { query: { enabled: Boolean(code), retry: false } }
  )

  useEffect(() => {
    const session = callbackQuery.data
    const token = session?.accessToken

    if (!token || handledToken.current === token) return
    handledToken.current = token
    saveAuthToken(token)
    setSession(session.user ?? null, session.user?.email ?? "")

    const storedReturnPath = sessionStorage.getItem(googleReturnPathKey)
    sessionStorage.removeItem(googleReturnPathKey)
    const destination =
      storedReturnPath?.startsWith(`/${language}/`) &&
      !storedReturnPath.startsWith("//")
        ? storedReturnPath
        : `/${language}/dashboard`

    router.replace(destination)
    router.refresh()
  }, [callbackQuery.data, language, router, setSession])

  if (!code || callbackQuery.isError) {
    return (
      <CallbackMessage
        title={t("login.googleFailed")}
        action={t("login.backToLogin")}
        href={`/${language}/login`}
      />
    )
  }

  return <CallbackMessage title={t("login.googleCompleting")} />
}

function CallbackMessage({
  title,
  action,
  href,
}: {
  title: string
  action?: string
  href?: string
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-medium">{title}</p>
        {action && href ? (
          <Link
            href={href}
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {action}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
