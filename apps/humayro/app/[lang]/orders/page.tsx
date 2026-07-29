import { redirect } from "next/navigation"

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  redirect(`/${lang}/dashboard/orders`)
}
