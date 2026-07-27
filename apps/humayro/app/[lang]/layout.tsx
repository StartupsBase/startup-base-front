import "leaflet/dist/leaflet.css"
import type { Metadata } from "next"
import { M_PLUS_1_Code, M_PLUS_Rounded_1c, Manrope } from "next/font/google"
import { notFound } from "next/navigation"
import "react-phone-number-input/style.css"

import Footer from "./_components/footer"
import Header from "./_components/header"
import { I18nProvider } from "@/components/i18n-provider"
import { CookieConsent } from "@/components/cookie-consent"
import HumayroLoader from "./_components/loader"
import { QueryProvider } from "@/components/query-provider"
import { SonnerProvider } from "@/components/sonner-provider"
import { TelegramProvider } from "@/components/telegram-provider"
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from "nextjs-toploader"
import { isLanguage, languages } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { createPageMetadata, getSiteUrl } from "@/lib/seo"
import { cn } from "@workspace/ui/lib/utils"
import "../theme.css"

const mPlusRounded1c = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
})

const mPlus1Code = M_PLUS_1_Code({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const manrope = Manrope({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
})

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}

  const { t } = await getTranslation(lang)
  const base = createPageMetadata({
    language: lang,
    title: "Humayro",
    description: t("seo.siteDescription"),
    keywords: t("seo.keywords", { returnObjects: true }) as string[],
  })

  return {
    ...base,
    metadataBase: getSiteUrl(),
    title: {
      default: t("seo.siteTitle"),
      template: "%s | Humayro",
    },
    applicationName: "Humayro",
    authors: [{ name: "Humayro", url: getSiteUrl() }],
    creator: "Humayro",
    publisher: "Humayro",
    category: "shopping",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      address: false,
      email: false,
      telephone: false,
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) {
    notFound()
  }
  const cookieCopy =
    lang === "uz"
      ? {
          heading: "Cookie fayllaridan foydalanamiz",
          description:
            "Saytning to‘g‘ri ishlashi va xizmatlarni yaxshilash uchun cookie fayllaridan foydalanamiz.",
          consentText:
            "“Qabul qilish” tugmasini bosish orqali cookie fayllaridan foydalanishga rozilik bildirasiz.",
          accept: "Qabul qilish",
          decline: "Rad etish",
          learnMore: "Batafsil",
        }
      : {
          heading: "Мы используем cookie",
          description:
            "Мы используем cookie для корректной работы сайта и улучшения наших сервисов.",
          consentText:
            "Нажимая «Принять», вы соглашаетесь на использование cookie.",
          accept: "Принять",
          decline: "Отклонить",
          learnMore: "Подробнее",
        }

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        mPlusRounded1c.variable,
        mPlus1Code.variable,
        manrope.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <QueryProvider>
            <TelegramProvider>
              <I18nProvider language={lang}>
                <HumayroLoader>
                  <NextTopLoader color="#008872" showSpinner={false} />
                  <Header language={lang} />
                  {children}
                  <Footer language={lang} />
                  <CookieConsent
                    heading={cookieCopy.heading}
                    description={cookieCopy.description}
                    consentText={cookieCopy.consentText}
                    acceptLabel={cookieCopy.accept}
                    declineLabel={cookieCopy.decline}
                    learnMoreLabel={cookieCopy.learnMore}
                    learnMoreHref={`/${lang}/privacy-policy`}
                  />
                </HumayroLoader>
              </I18nProvider>
            </TelegramProvider>
          </QueryProvider>
          <SonnerProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
