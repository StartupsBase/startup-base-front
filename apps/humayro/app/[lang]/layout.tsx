import { M_PLUS_1_Code, M_PLUS_Rounded_1c } from "next/font/google"
import { notFound } from "next/navigation"
import "react-phone-number-input/style.css"
import "leaflet/dist/leaflet.css"

import { I18nProvider } from "@/components/i18n-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { TelegramProvider } from "@/components/telegram-provider"
import { SonnerProvider } from "@/components/sonner-provider"
import { isLanguage, languages } from "@/i18n/config"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import "../theme.css"
import { CustomCursor } from "@/components/custom-cursor"
import HumayroLoader from "@/components/loader"
import Header from "@/components/header/Header"
import Footer from "@/components/footer/Footer"
import Container from "@/components/container"

const mPlusRounded1c = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const mPlus1Code = M_PLUS_1_Code({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }))
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

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        mPlusRounded1c.variable,
        mPlus1Code.variable,
        "font-sans"
      )}
    >
      <body>
        <CustomCursor />
        <ThemeProvider>
          <QueryProvider>
            <TelegramProvider>
              <I18nProvider language={lang}>
                <HumayroLoader>
                  <Container>
                    <Header language={lang} />
                    {children}
                  </Container>
                  <Footer language={lang} />
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
