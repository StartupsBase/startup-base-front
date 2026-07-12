import Link from "next/link"
import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { Button } from "@workspace/ui/components/button"
import { ShimmerButton } from "@workspace/ui/components/shimmer-button"

export default async function Page({ params }: { params: Promise<unknown> }) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  const { t } = await getTranslation(lang)

  return (
    <main className="min-h-1000 bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-5 md:px-10">
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
          <p className="mb-6 text-sm font-semibold tracking-[0.24em] text-primary uppercase">
            {t("home.eyebrow")}
          </p>
          <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl">
            {t("home.title")}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {t("home.description")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={`/${lang}/book-demo`}>
              <ShimmerButton className="h-[40px] min-w-40 bg-input/30! px-4">
                {t("home.bookingDemoAction")}
              </ShimmerButton>
            </Link>
            <Button asChild size="lg" className="min-w-40">
              <Link href={`/${lang}/login`}>{t("home.primaryAction")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-40">
              <Link href={`/${lang}/register`}>
                {t("home.secondaryAction")}
              </Link>
            </Button>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground sm:text-base">
            <span>{t("home.featureOne.title")}</span>
            <span>{t("home.featureTwo.title")}</span>
            <span>{t("home.featureThree.title")}</span>
          </div>
        </section>
      </div>
    </main>
  )
}
