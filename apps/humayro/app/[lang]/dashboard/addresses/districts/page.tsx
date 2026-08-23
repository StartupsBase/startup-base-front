import { notFound } from "next/navigation"

import { isLanguage } from "@/i18n/config"
import { DistrictsDirectoryPage } from "../_components/address-directory-pages"

export default async function DistrictsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ regionId?: string | string[] }>
}) {
  const { lang } = await params
  const { regionId: regionIdParam } = await searchParams

  if (!isLanguage(lang)) notFound()

  const regionIdValue = Array.isArray(regionIdParam)
    ? regionIdParam[0]
    : regionIdParam
  const parsedRegionId = Number(regionIdValue)
  const regionId =
    Number.isSafeInteger(parsedRegionId) && parsedRegionId > 0
      ? parsedRegionId
      : undefined

  return (
    <DistrictsDirectoryPage
      key={regionId ?? "all"}
      language={lang}
      initialRegionId={regionId}
    />
  )
}
