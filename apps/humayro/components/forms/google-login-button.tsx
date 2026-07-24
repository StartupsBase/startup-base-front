"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import type { JwtDTO } from "@/lib/api"
import { getPostLoginPath, googleReturnPathKey } from "@/lib/auth"
import { saveAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"

const googleCallbackPath = "/api/auth/google/callback"
const popupTimeoutMs = 2 * 60 * 1000

function getSafeReturnPath(pathname: string, search: string) {
  const language = pathname.split("/")[1] ?? "ru"
  const requestedPath = new URLSearchParams(search).get("next")

  return requestedPath?.startsWith(`/${language}/`) &&
    !requestedPath.startsWith("//")
    ? requestedPath
    : null
}

export function GoogleLoginButton() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const setSession = useAuthStore((state) => state.setSession)
  const [redirecting, setRedirecting] = useState(false)

  async function signInWithGoogle() {
    const language = pathname.split("/")[1] ?? "ru"
    const returnPath = getSafeReturnPath(pathname, window.location.search)
    const popup = openGooglePopup()

    if (!popup) {
      toast.error(t("login.googleFailed"))
      return
    }

    if (returnPath) {
      sessionStorage.setItem(googleReturnPathKey, returnPath)
    } else {
      sessionStorage.removeItem(googleReturnPathKey)
    }

    setRedirecting(true)

    try {
      popup.location.replace(`/${language}/auth/google/start`)
      const result = await waitForGooglePopup(popup, language)

      if (result.type === "redirect") {
        window.location.assign(result.destination)
        return
      }

      const { session } = result

      if (!session.accessToken) {
        throw new Error("Google session is missing an access token")
      }

      saveAuthToken(session.accessToken)
      setSession(session.user ?? null, session.user?.email ?? "")
      popup.close()

      const storedReturnPath = sessionStorage.getItem(googleReturnPathKey)
      sessionStorage.removeItem(googleReturnPathKey)
      const destination =
        storedReturnPath?.startsWith(`/${language}/`) &&
        !storedReturnPath.startsWith("//")
          ? storedReturnPath
          : getPostLoginPath(language, session.user?.roles)

      window.location.assign(destination)
    } catch {
      popup.close()
      setRedirecting(false)
      toast.error(t("login.googleFailed"))
    }
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

function openGooglePopup() {
  const width = 520
  const height = 700
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)

  return window.open(
    "about:blank",
    "humayro-google-auth",
    `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`
  )
}

type GooglePopupResult =
  | { type: "session"; session: JwtDTO }
  | { type: "redirect"; destination: string }

function waitForGooglePopup(
  popup: Window,
  language: string
): Promise<GooglePopupResult> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error("Google sign-in was cancelled")))
        return
      }

      if (Date.now() - startedAt > popupTimeoutMs) {
        finish(() => reject(new Error("Google sign-in timed out")))
        return
      }

      try {
        const popupUrl = new URL(popup.location.href)

        if (popupUrl.origin !== window.location.origin) return

        if (popupUrl.pathname === googleCallbackPath) {
          if (popupUrl.searchParams.has("error")) {
            finish(() => reject(new Error("Google returned an OAuth error")))
            return
          }

          const responseText = popup.document.body?.innerText.trim()

          if (!responseText) return

          try {
            const session = JSON.parse(responseText) as JwtDTO

            if (session.accessToken) {
              finish(() => resolve({ type: "session", session }))
            }
          } catch {
            // The frontend callback can briefly render an HTML completion page.
          }
          return
        }

        const localizedCallbackPath = `/${language}/auth/google/callback`

        if (popupUrl.pathname === localizedCallbackPath) {
          if (popupUrl.searchParams.has("error")) {
            finish(() => reject(new Error("Google callback failed")))
          }
          return
        }

        const isCompletedAppNavigation =
          popupUrl.pathname === `/${language}` ||
          popupUrl.pathname.startsWith(`/${language}/dashboard`)

        if (isCompletedAppNavigation) {
          finish(() =>
            resolve({
              type: "redirect",
              destination: `${popupUrl.pathname}${popupUrl.search}${popupUrl.hash}`,
            })
          )
        }
      } catch {
        // Google pages are cross-origin until OAuth returns to humayro.uz.
      }
    }, 250)

    function finish(callback: () => void) {
      window.clearInterval(interval)
      callback()
    }
  })
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
