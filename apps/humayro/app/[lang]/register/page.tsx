import { notFound } from "next/navigation"

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
    <main className="relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6 sm:py-14 ">
      <section className="relative w-full max-w-136 overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 p-5 shadow-[0_28px_90px_rgba(0,38,32,.12)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-[#17251c]/95 dark:shadow-[0_32px_100px_rgba(0,0,0,.32)]">
        <div
          aria-hidden="true"
          className="absolute inset-x-12 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent dark:via-[#20cdb4]/70"
        />

        <div className="mb-8 space-y-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-primary uppercase dark:border-[#20cdb4]/20 dark:bg-[#20cdb4]/8 dark:text-[#5ee3cf]">
            <span className="size-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
            Humayro
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-[2rem]">
            {t("register.title")}
          </h1>
          <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-[15px]">
            {t("register.subtitle")}
          </p>
        </div>

        <RegisterForm language={lang} />
      </section>
    </main>
  )
}
