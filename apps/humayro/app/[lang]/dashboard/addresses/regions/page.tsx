import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { RegionsDirectoryPage } from "../_components/address-directory-pages"

export default async function RegionsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  return <RegionsDirectoryPage language={lang} />
}
