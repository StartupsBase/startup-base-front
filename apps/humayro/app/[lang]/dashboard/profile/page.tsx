import { notFound } from "next/navigation"

import { ProfileForm } from "./_components/profile-form"
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
    page: "profile",
    path: "/dashboard/profile",
    noIndex: true,
  })
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) {
    notFound()
  }

  return <ProfileForm language={lang} />
}
