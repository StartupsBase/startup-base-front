import { Figtree, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"

import "@workspace/ui/globals.css"
import "../theme.css"
import { I18nProvider } from "@/components/i18n-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { isLanguage, languages } from "@/i18n/config"
import { cn } from "@workspace/ui/lib/utils"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable)}
    >
      <body>
        <ThemeProvider>
          <I18nProvider language={lang}>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
