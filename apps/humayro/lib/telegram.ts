import type { YMaps3 } from '@workspace/ui/types'
export type TelegramColorScheme = "light" | "dark"

export type TelegramWebAppUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export type TelegramWebApp = {
  initData: string
  initDataUnsafe: {
    user?: TelegramWebAppUser
    start_param?: string
  }
  colorScheme: TelegramColorScheme
  platform: string
  version: string
  ready: () => void
  expand: () => void
  close: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
    ymaps?: YMaps3
  }
}

export const telegramScriptUrl = "https://telegram.org/js/telegram-web-app.js"

export function getTelegramWebApp() {
  return window.Telegram?.WebApp ?? null
}

