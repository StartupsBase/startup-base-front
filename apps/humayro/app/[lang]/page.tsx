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
import { createTranslatedPageMetadata, getSiteUrl } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({ language: lang, page: "home" })
}

export default async function Page({ params }: { params: Promise<unknown> }) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }
  const { t } = await getTranslation(lang)
  const onlineStoreJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Humayro",
    url: new URL(`/${lang}`, getSiteUrl()).toString(),
    description: t("seo.siteDescription"),
    logo: new URL("/brand/humayroLight.png", getSiteUrl()).toString(),
    availableLanguage: ["Russian", "Uzbek"],
    areaServed: {
      "@type": "Country",
      name: "Uzbekistan",
    },
  }

  return (
    <main className="humayro-top-background relative min-h-screen overflow-x-clip text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(onlineStoreJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-14 sm:px-6 sm:pt-4 sm:pb-18 md:px-10 lg:pt-6">
        <section className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center py-10 text-center sm:min-h-[calc(100svh-9rem)] sm:py-16 lg:min-h-[calc(100svh-7rem)] lg:py-20">
          <DiaTextReveal
            text={t("home.eyebrow")}
            duration={1.5}
            className="text-DiaTextRevealrimary mb-4 max-w-xs text-xs font-semibold tracking-[0.18em] capitalize sm:mb-6 sm:max-w-none sm:text-sm sm:tracking-[0.24em]"
          />
          <TextAnimate
            animation="blurInUp"
            by="character"
            duration={1.5}
            className="max-w-5xl text-[clamp(2.5rem,12.5vw,4.5rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl"
          >
            {t("home.title")}
          </TextAnimate>
          <TextAnimate
            animation="slideLeft"
            by="character"
            duration={1.5}
            className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-8 sm:text-xl sm:leading-8"
          >
            {t("home.description")}
          </TextAnimate>

          <div className="mt-8 flex w-full max-w-sm flex-col justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap">
            <Link href={`/${lang}/book-demo`} className="w-full sm:w-auto">
              <ShimmerButton
                background={`#008872`}
                className="h-10 w-full min-w-36 bg-input/30! px-3 text-sm sm:h-12 sm:w-auto sm:min-w-44 sm:px-6 sm:text-base lg:h-14 lg:min-w-48 lg:px-7 lg:text-lg dark:border-primary"
              >
                {t("home.bookingDemoAction")}
              </ShimmerButton>
            </Link>
            <Button
              asChild
              size="lg"
              className="h-10 w-full min-w-36 px-3 text-sm sm:h-12 sm:w-auto sm:min-w-44 sm:px-6 sm:text-base lg:h-14 lg:min-w-48 lg:px-7 lg:text-lg"
            >
              <Link href={`/${lang}/login`}>{t("home.primaryAction")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-10 w-full min-w-36 px-3 text-sm sm:h-12 sm:w-auto sm:min-w-44 sm:px-6 sm:text-base lg:h-14 lg:min-w-48 lg:px-7 lg:text-lg"
            >
              <Link href={`/${lang}/register`}>
                {t("home.secondaryAction")}
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid w-full max-w-sm grid-cols-1 gap-2 text-left text-sm font-medium text-muted-foreground sm:mt-12 sm:max-w-3xl sm:grid-cols-3 sm:gap-3 sm:text-center sm:text-base">
            <span className="rounded-2xl border border-border/60 bg-background/45 px-4 py-3 backdrop-blur-sm">
              {t("home.featureOne.title")}
            </span>
            <span className="rounded-2xl border border-border/60 bg-background/45 px-4 py-3 backdrop-blur-sm">
              {t("home.featureTwo.title")}
            </span>
            <span className="rounded-2xl border border-border/60 bg-background/45 px-4 py-3 backdrop-blur-sm">
              {t("home.featureThree.title")}
            </span>
          </div>
        </section>

        <div className="pb-4 sm:pb-8">
          <YouTubeVideo />
        </div>
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
