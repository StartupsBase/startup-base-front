import { notFound } from "next/navigation"

import { LanguageSwitcher } from "@/components/language-switcher"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { Button } from "@workspace/ui/components/button"

export default async function Page({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  const { t } = await getTranslation(lang)

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <LanguageSwitcher language={lang} />
        <div>
          <h1 className="font-medium">{t("home.title")}</h1>
          <p>{t("home.intro")}</p>
          <p>{t("home.buttonReady")}</p>
          <Button className="mt-2">{t("home.action")}</Button>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          {t("home.themeHint")}
        </div>
      </div>
    </div>
  )
}
