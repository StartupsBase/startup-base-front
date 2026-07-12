"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { getApiBaseUrl } from "@/lib/api-url"
import { googleReturnPathKey } from "@/lib/auth"

function getSafeReturnPath(pathname: string, search: string) {
  const language = pathname.split("/")[1] ?? "ru"
  const requestedPath = new URLSearchParams(search).get("next")

  return requestedPath?.startsWith(`/${language}/`) &&
    !requestedPath.startsWith("//")
    ? requestedPath
    : `/${language}/dashboard`
}

export function GoogleLoginButton() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [redirecting, setRedirecting] = useState(false)

  function signInWithGoogle() {
    setRedirecting(true)
    sessionStorage.setItem(
      googleReturnPathKey,
      getSafeReturnPath(pathname, window.location.search)
    )
    window.location.assign(`${getApiBaseUrl()}/api/auth/google`)
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={signInWithGoogle}
      disabled={redirecting}
    >
      <GoogleIcon />
      {redirecting
        ? t("login.googleRedirecting")
        : t("login.continueWithGoogle")}
    </Button>
  )
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.52h3.23c1.89-1.74 2.98-4.31 2.98-7.37Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.23-2.52c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.12-1.31.31-1.92v-2.6H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.52l3.33-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.78.5 3.82 1.48l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.92 5.48l3.33 2.6C7.2 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  )
}
