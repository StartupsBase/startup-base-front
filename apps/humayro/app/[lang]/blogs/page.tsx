import { createTranslatedPageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "blogs",
    path: "/blogs",
  })
}

const BlogsPage = () => {
  return <div>Gey</div>
}

export default BlogsPage
