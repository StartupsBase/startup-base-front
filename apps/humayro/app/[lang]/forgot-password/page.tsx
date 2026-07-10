import { notFound } from "next/navigation"

import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { LogoBrand } from "@/components/logo"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"

export default async function ForgotPasswordPage({
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
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-10">
      <section className="w-full max-w-sm space-y-8">
        <LogoBrand />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("passwordRecovery.requestTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("passwordRecovery.requestDescription")}
          </p>
        </div>
        <ForgotPasswordForm language={lang} />
      </section>
    </main>
  )
}
