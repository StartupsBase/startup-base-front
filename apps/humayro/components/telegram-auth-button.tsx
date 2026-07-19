"use client"

import { TelegramIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { useTelegram } from "@/components/telegram-provider"

const telegramMiniAppUrl = "https://t.me/humayro_app_bot?startapp"

export function TelegramAuthButton() {
  const { t } = useTranslation()
  const { isMiniApp, status } = useTelegram()

  if (isMiniApp) {
    const isAuthenticating = status === "authenticating"

    return (
      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-[#229ED9] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(34,158,217,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#168AC0] hover:shadow-[0_12px_28px_-10px_rgba(34,158,217,0.95)]"
        disabled={isAuthenticating || status === "authenticated"}
        onClick={status === "error" ? () => window.location.reload() : undefined}
      >
        <span className="grid size-7 place-items-center rounded-full bg-white/15">
          <HugeiconsIcon icon={TelegramIcon} className="size-4" />
        </span>
        {status === "error"
          ? t("login.telegramRetry")
          : t("login.telegramAuthenticating")}
      </Button>
    )
  }

  return (
    <Button
      asChild
      className="h-12 w-full rounded-xl bg-[#229ED9] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(34,158,217,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#168AC0] hover:shadow-[0_12px_28px_-10px_rgba(34,158,217,0.95)]"
    >
      <a href={telegramMiniAppUrl} target="_blank" rel="noopener noreferrer">
        <span className="grid size-7 place-items-center rounded-full bg-white/15">
          <HugeiconsIcon icon={TelegramIcon} className="size-4" />
        </span>
        {t("login.continueWithTelegram")}
      </a>
    </Button>
  )
}
