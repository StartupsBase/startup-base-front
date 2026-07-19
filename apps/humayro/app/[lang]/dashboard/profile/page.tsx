import { notFound } from "next/navigation"

import { ProfileForm } from "./_components/profile-form"
import { isLanguage } from "@/i18n/config"

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
