"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Script from "next/script"

import { telegram } from "@/lib/api"
import { saveAuthToken } from "@/lib/auth-client"
import {
  getTelegramWebApp,
  telegramScriptUrl,
  type TelegramWebApp,
} from "@/lib/telegram"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { useTheme } from "@/components/theme-provider"
import { getPostAuthDestination } from "@/lib/auth-routing"

type TelegramStatus = "unavailable" | "authenticating" | "authenticated" | "error"

type TelegramContextValue = {
  webApp: TelegramWebApp | null
  isMiniApp: boolean
  status: TelegramStatus
  error: Error | null
}

const TelegramContext = React.createContext<TelegramContextValue>({
  webApp: null,
  isMiniApp: false,
  status: "unavailable",
  error: null,
})

let pendingAuthentication: ReturnType<typeof telegram> | null = null

function authenticate(initData: string) {
  pendingAuthentication ??= telegram({ initData }).finally(() => {
    pendingAuthentication = null
  })

  return pendingAuthentication
}

function isAuthenticationPage(pathname: string) {
  return /\/(login|register|forgot-password|reset-password)$/.test(pathname)
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const setSession = useAuthStore((state) => state.setSession)
  const authenticatedInitData = React.useRef<string | null>(null)
  const [sdkReady, setSdkReady] = React.useState(false)
  const [value, setValue] = React.useState<TelegramContextValue>({
    webApp: null,
    isMiniApp: false,
    status: "unavailable",
    error: null,
  })

  React.useEffect(() => {
    const webApp = getTelegramWebApp()
    const initData = webApp?.initData

    if (!sdkReady || !webApp || !initData) {
      return
    }

    webApp.ready()
    webApp.expand()
    setTheme(webApp.colorScheme)

    if (authenticatedInitData.current === initData) {
      setValue({ webApp, isMiniApp: true, status: "authenticated", error: null })
      return
    }

    let active = true
    setValue({ webApp, isMiniApp: true, status: "authenticating", error: null })

    void authenticate(initData)
      .then((session) => {
        const token = session.accessToken

        if (!token) {
          throw new Error("Telegram authentication returned no access token")
        }

        saveAuthToken(token)
        authenticatedInitData.current = initData
        setSession(
          session.user ?? null,
          webApp.initDataUnsafe.user?.username ??
            String(webApp.initDataUnsafe.user?.id ?? "")
        )

        if (!active) {
          return
        }

        setValue({ webApp, isMiniApp: true, status: "authenticated", error: null })

        if (isAuthenticationPage(pathname)) {
          const language = pathname.split("/")[1] ?? "ru"
          router.replace(getPostAuthDestination(language, session.user))
          router.refresh()
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return
        }

        const error = cause instanceof Error ? cause : new Error("Telegram authentication failed")
        setValue({ webApp, isMiniApp: true, status: "error", error })
      })

    return () => {
      active = false
    }
  }, [pathname, router, sdkReady, setSession, setTheme])

  return (
    <TelegramContext.Provider value={value}>
      {children}
      <Script src={telegramScriptUrl} onReady={() => setSdkReady(true)} />
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  return React.useContext(TelegramContext)
}
