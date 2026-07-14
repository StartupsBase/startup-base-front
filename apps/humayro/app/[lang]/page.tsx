import Link from "next/link"
import { notFound } from "next/navigation"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { Button } from "@workspace/ui/components/button"
import { ShimmerButton } from "@workspace/ui/components/shimmer-button"
import { TextAnimate } from "@workspace/ui/components/text-animate"
import { DiaTextReveal } from "@workspace/ui/components/dia-text-reveal"
import YouTubeVideo from "@/components/you-tube"
import KpiStatsCards from "@/components/kpi-stats-cards"
import CustomerStories from "./_components/customer-stories"
import FaqSection from "./_components/faq-section"
import TeamSection from "./_components/team-section"
import { CatalogSection } from "./_components/storefront/catalog-section"
import InfiniteScroll from "@/components/infinite-scroll"
import Support from "@/components/support"

export default async function Page({ params }: { params: Promise<unknown> }) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }
  const { t } = await getTranslation(lang)

  return (
    <main className="humayro-top-background min-h-1000 text-foreground relative">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-5 md:px-10">
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
          <DiaTextReveal
            text={t("home.eyebrow")}
            duration={1.5}
            className="text-DiaTextRevealrimary mb-6 text-sm font-semibold tracking-[0.24em] uppercase"
          />
          <TextAnimate
            animation="blurInUp"
            by="character"
            duration={1.5}
            className="max-w-5xl text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl"
          >
            {t("home.title")}
          </TextAnimate>
          <TextAnimate
            animation="slideLeft"
            by="character"
            duration={1.5}
            className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
          >
            {t("home.description")}
          </TextAnimate>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={`/${lang}/book-demo`}>
              <ShimmerButton
                background={`#008872`}
                className="h-[40px] min-w-40 bg-input/30! px-4 dark:border-primary"
              >
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

        <YouTubeVideo />
      </div>
      <InfiniteScroll />
      <CatalogSection language={lang} />
      <KpiStatsCards />
      <CustomerStories lang={lang} />
      <TeamSection lang={lang} />
      <FaqSection lang={lang} />
      <Support />
    </main>
  )
}
