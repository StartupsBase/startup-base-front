import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "privacy",
    path: "/privacy-policy",
  })
}

const PrivacyPolicyPage = () => {
  return <div>PrivacyPolicyPage</div>
}

export default PrivacyPolicyPage
