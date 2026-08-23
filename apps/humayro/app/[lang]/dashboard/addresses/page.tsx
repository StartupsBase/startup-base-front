import { notFound, redirect } from "next/navigation"

import { isLanguage } from "@/i18n/config"

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  redirect(`/${lang}/dashboard/addresses/regions`)
}
