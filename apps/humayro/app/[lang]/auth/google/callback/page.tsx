import { Suspense } from "react"
import { notFound } from "next/navigation"

import { GoogleLoginCallback } from "./_components/google-login-callback"
import { isLanguage } from "@/i18n/config"
import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "googleCallback",
    path: "/auth/google/callback",
    noIndex: true,
  })
}

export default async function GoogleCallbackPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  return (
    <Suspense fallback={null}>
      <GoogleLoginCallback language={lang} />
    </Suspense>
  )
}
