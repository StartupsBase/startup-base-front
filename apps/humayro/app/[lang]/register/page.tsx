import { notFound } from "next/navigation"

import { LogoBrand } from "@/components/logo"
import { RegisterForm } from "./_components/register-form"
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
    page: "register",
    path: "/register",
    noIndex: true,
  })
}

export default async function RegisterPage({
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
      <section className="w-full max-w-md space-y-8 rounded-3xl border p-4 dark:border-none dark:border-white/10 dark:bg-[#17251c]/90">
        <LogoBrand />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("register.title")}
          </h1>
          <p className="text-muted-foreground">{t("register.subtitle")}</p>
        </div>
        <RegisterForm language={lang} />
      </section>
    </main>
  )
}
