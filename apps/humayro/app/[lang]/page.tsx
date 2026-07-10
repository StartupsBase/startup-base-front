import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import dashboardIllustration from "@/assets/layers/oc-on-the-laptop.svg"
import { Button } from "@workspace/ui/components/button"

export default async function Page({ params }: { params: Promise<unknown> }) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  const { t } = await getTranslation(lang)

  return (
    <main className="min-h-svh overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-5 md:px-10">
        <header className="flex items-center justify-between">
          <Link
            href={`/${lang}`}
            className="flex items-center gap-3 text-base font-semibold tracking-tight"
          >
            <Logo className="size-10 text-primary" />
            <span>{t("login.brand")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher language={lang} />
            <Button asChild className="hidden sm:inline-flex">
              <Link href={`/${lang}/login`}>{t("home.loginAction")}</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {t("home.eyebrow")}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              {t("home.description")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/${lang}/login`}>{t("home.primaryAction")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#benefits">{t("home.secondaryAction")}</a>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 -z-10 rounded-full bg-primary/20 blur-3xl" />
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Logo className="size-10 text-primary" />
                  <div>
                    <p className="font-semibold">{t("login.brand")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("home.previewLabel")}
                    </p>
                  </div>
                </div>
                <span className="size-2 rounded-full bg-primary" />
              </div>

              <div className="mt-8 rounded-3xl bg-secondary/70 p-4 dark:bg-secondary/50">
                <Image
                  src={dashboardIllustration}
                  alt=""
                  className="h-auto w-full"
                  priority
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-2xl font-semibold">24/7</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("home.statOne")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-2xl font-semibold">100%</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("home.statTwo")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="benefits"
          className="grid gap-4 border-t border-border py-8 sm:grid-cols-3"
        >
          {["featureOne", "featureTwo", "featureThree"].map((feature) => (
            <article key={feature} className="rounded-2xl bg-muted/60 p-5">
              <h2 className="font-semibold">{t(`home.${feature}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`home.${feature}.description`)}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
