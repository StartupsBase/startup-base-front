import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { Button } from "@workspace/ui/components/button"
import { ShimmerButton } from "@workspace/ui/components/shimmer-button"
import { TextAnimate } from "@workspace/ui/components/text-animate"
import { DiaTextReveal } from "@workspace/ui/components/dia-text-reveal"
import CustomerStories from "./_components/customer-stories"
import FaqSection from "./_components/faq-section"
import TeamSection from "./_components/team-section"
import { CatalogSection } from "./_components/storefront/catalog-section"
import Support from "@/components/support"
import { BlurFade } from "@workspace/ui/components/blur-fade"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type PageProps = { params: Promise<{ lang: string }> }

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://humayro.uz"

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params
  const uz = lang === "uz"
  const title = uz
    ? "Humayro — O‘zbekistondagi kiyim do‘konlari bir joyda"
    : "Humayro — магазины одежды Узбекистана в одном месте"
  const description = uz
    ? "Ippodrom va O‘zbekiston kiyim do‘konlaridan liboslarni toping, narx va o‘lchamlarni solishtiring, bir joyda buyurtma bering."
    : "Находите одежду в Ippodrom и магазинах Узбекистана, сравнивайте цены и размеры и оформляйте заказ в одном месте."

  return {
    title,
    description,
    keywords: uz
      ? [
          "kiyim",
          "onlayn kiyim do‘koni",
          "Ippodrom",
          "Toshkent kiyim bozori",
          "Humayro",
        ]
      : ["одежда Узбекистан", "магазины одежды", "Ippodrom", "Humayro"],
    alternates: {
      canonical: `${siteUrl}/${lang}`,
      languages: {
        uz: `${siteUrl}/uz`,
        ru: `${siteUrl}/ru`,
        "x-default": `${siteUrl}/uz`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${lang}`,
      siteName: "Humayro",
      locale: uz ? "uz_UZ" : "ru_UZ",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function Page({ params }: { params: Promise<unknown> }) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }
  const { t } = await getTranslation(lang)
  const copy =
    lang === "uz"
      ? {
          audience: "Xaridorlar va do‘konlar uchun",
          discoveryTitle: "Qidirishdan kiyib ko‘rishgacha — bitta qulay yo‘l.",
          discoveryText:
            "Tarqoq Telegram kanallari va o‘nlab sahifalar o‘rniga, kerakli libosni kategoriya, rang, o‘lcham va narx bo‘yicha toping.",
          steps: [
            [
              "01",
              "Toping",
              "O‘zbekiston do‘konlaridagi mahsulotlarni bir katalogda ko‘ring.",
            ],
            [
              "02",
              "Solishtiring",
              "Narx, rang, o‘lcham va mavjudlikni aniq tekshiring.",
            ],
            [
              "03",
              "Buyurtma bering",
              "Tanlovingizni savatga qo‘shib, buyurtmani tez rasmiylashtiring.",
            ],
          ],
          sellerEyebrow: "Ippodrom do‘konlari uchun",
          sellerTitle: "Do‘koningiz peshtaxtadan tashqarida ham sotaversin.",
          sellerText:
            "Humayro Ippodrom va boshqa kiyim do‘konlariga mahsulotlarini onlayn ko‘rsatish, yangi xaridorlarga chiqish va buyurtmalarni tartibli boshqarish imkonini beradi.",
          sellerPoints: [
            "Mahsulot va qoldiqni tushunarli katalogda ko‘rsating",
            "Toshkentdan butun O‘zbekistonga yangi xaridor toping",
            "Buyurtmalarni bitta boshqaruv panelida kuzating",
          ],
          sellerCta: "Do‘kon uchun bepul demo",
          catalogEyebrow: "Jonli katalog",
          catalogTitle: "Sizga mos libos shu yerda bo‘lishi mumkin.",
        }
      : {
          audience: "Для покупателей и магазинов",
          discoveryTitle: "От поиска до примерки — один удобный путь.",
          discoveryText:
            "Вместо десятков Telegram-каналов и страниц находите одежду по категории, цвету, размеру и цене.",
          steps: [
            [
              "01",
              "Найдите",
              "Смотрите товары магазинов Узбекистана в едином каталоге.",
            ],
            [
              "02",
              "Сравните",
              "Проверяйте цену, цвет, размер и наличие без лишних вопросов.",
            ],
            [
              "03",
              "Закажите",
              "Добавьте выбранное в корзину и быстро оформите заказ.",
            ],
          ],
          sellerEyebrow: "Для магазинов Ippodrom",
          sellerTitle: "Пусть ваш магазин продаёт и за пределами прилавка.",
          sellerText:
            "Humayro помогает магазинам Ippodrom и другим продавцам одежды показывать ассортимент онлайн, находить новых покупателей и удобно вести заказы.",
          sellerPoints: [
            "Показывайте ассортимент и остатки в понятном каталоге",
            "Находите покупателей по всему Узбекистану",
            "Следите за заказами в одной панели управления",
          ],
          sellerCta: "Бесплатное демо для магазина",
          catalogEyebrow: "Живой каталог",
          catalogTitle: "Возможно, ваш образ уже здесь.",
        }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Humayro",
    url: `${siteUrl}/${lang}`,
    description: t("home.description"),
    areaServed: { "@type": "Country", name: "Uzbekistan" },
    availableLanguage: ["uz", "ru"],
  }

  return (
    <main className="humayro-top-background relative overflow-hidden text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div aria-hidden="true" className="humayro-orb humayro-orb-one" />
      <div aria-hidden="true" className="humayro-orb humayro-orb-two" />
      <div className="mx-auto flex min-h-[88svh] w-full max-w-6xl flex-col px-6 py-5 md:px-10">
        <section className="relative flex flex-1 flex-col items-center justify-center py-20 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/55 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-primary uppercase backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            {copy.audience}
          </div>
          <DiaTextReveal
            text={t("home.eyebrow")}
            duration={1.5}
            className="mb-5 text-sm font-semibold tracking-[0.24em] text-primary uppercase"
          />
          <TextAnimate
            animation="blurInUp"
            by="word"
            duration={1.1}
            className="max-w-5xl text-5xl leading-[0.96] font-semibold tracking-[-0.06em] text-balance sm:text-7xl lg:text-[5.8rem]"
          >
            {t("home.title")}
          </TextAnimate>
          <TextAnimate
            animation="slideLeft"
            by="word"
            duration={0.9}
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

          <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {["featureOne", "featureTwo", "featureThree"].map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-white/60 bg-background/45 p-4 backdrop-blur-md dark:border-white/10"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="mb-3 size-5 text-primary"
                />
                <p className="font-semibold">{t(`home.${feature}.title`)}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {t(`home.${feature}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28 md:px-10">
        <BlurFade inView>
          <p className="text-sm font-semibold text-primary">
            {copy.discoveryTitle}
          </p>
        </BlurFade>
        <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
              {copy.discoveryTitle}
            </h2>
          </BlurFade>
          <div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              {copy.discoveryText}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {copy.steps.map(([number, title, text], index) => (
                <BlurFade key={number} delay={0.15 + index * 0.08} inView>
                  <article className="h-full rounded-3xl border bg-card/70 p-5 shadow-sm">
                    <span className="font-mono text-xs text-primary">
                      {number}
                    </span>
                    <h3 className="mt-8 text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {text}
                    </p>
                  </article>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-16 md:px-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0b3b32] px-6 py-12 text-white sm:px-12 sm:py-16 lg:grid lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">
              {copy.sellerEyebrow}
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
              {copy.sellerTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/70 sm:text-lg">
              {copy.sellerText}
            </p>
          </div>
          <div className="relative mt-10 flex flex-col justify-end lg:mt-0">
            <ul className="space-y-4">
              {copy.sellerPoints.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-sm leading-6 text-emerald-50/85"
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="mt-0.5 size-5 shrink-0 text-emerald-300"
                  />
                  {point}
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-8 w-fit bg-white text-[#0b3b32] hover:bg-emerald-50"
            >
              <Link href={`/${lang}/book-demo`}>
                <HugeiconsIcon icon={Store01Icon} className="size-5" />
                {copy.sellerCta}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pt-20 text-center md:px-10">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          {copy.catalogEyebrow}
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
          {copy.catalogTitle}
        </h2>
      </div>
      <CatalogSection language={lang} />
      <CustomerStories lang={lang} />
      <TeamSection lang={lang} />
      <FaqSection lang={lang} />
      <Support />
    </main>
  )
}
