import { notFound } from "next/navigation"

import { ProductCreatePage } from "./_components/product-create-page"
import { isLanguage } from "@/i18n/config"

export default async function NewProductPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang, id } = (await params) as { lang?: string; id?: string }
  const organizationId = Number(id)

  if (
    !isLanguage(lang) ||
    !Number.isSafeInteger(organizationId) ||
    organizationId <= 0
  ) {
    notFound()
  }

  return <ProductCreatePage language={lang} organizationId={organizationId} />
}
