import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { DistrictsDirectoryPage } from "../_components/address-directory-pages"

export default async function DistrictsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  return <DistrictsDirectoryPage language={lang} />
}
