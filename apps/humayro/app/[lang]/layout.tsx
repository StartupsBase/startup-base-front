import { Inter } from "next/font/google"
import { notFound } from "next/navigation"

import { I18nProvider } from "@/components/i18n-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { isLanguage, languages } from "@/i18n/config"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import "../theme.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
      className={cn("antialiased", inter.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>
          <I18nProvider language={lang}>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
