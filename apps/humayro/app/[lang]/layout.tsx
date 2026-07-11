import { M_PLUS_Rounded_1c } from "next/font/google"
import { notFound } from "next/navigation"
import "react-phone-number-input/style.css"
import "leaflet/dist/leaflet.css"

import { I18nProvider } from "@/components/i18n-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { isLanguage, languages } from "@/i18n/config"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import "../theme.css"
import HumayroLoader from "@/components/loader"

const mPlusRounded1c = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<unknown>
}>) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn("antialiased", mPlusRounded1c.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>
          <QueryProvider>
            <I18nProvider language={lang}>
              <HumayroLoader duration={7600}>{children}</HumayroLoader>
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
