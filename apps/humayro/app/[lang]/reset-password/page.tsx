import { notFound } from "next/navigation"

import { LogoBrand } from "@/components/logo"
import { ResetPasswordForm } from "./_components/reset-password-form"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "resetPassword",
    path: "/reset-password",
    noIndex: true,
  })
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<unknown>
  searchParams: Promise<{ phone?: string | string[] }>
}) {
  const { lang } = (await params) as { lang?: string }
  const { phone } = await searchParams

  if (!isLanguage(lang)) {
    notFound()
  }

  const { t } = await getTranslation(lang)

  const initialPhone = typeof phone === "string" ? phone : "+998"

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-10">
      <section className="w-full max-w-sm space-y-8">
        <LogoBrand />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("passwordRecovery.resetTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("passwordRecovery.resetDescription")}
          </p>
        </div>
        <ResetPasswordForm language={lang} phone={initialPhone} />
      </section>
    </main>
  )
}
