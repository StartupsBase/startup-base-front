import { Suspense } from "react"
import { notFound } from "next/navigation"

import { GoogleLoginCallback } from "@/components/google-login-callback"
import { isLanguage } from "@/i18n/config"

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
