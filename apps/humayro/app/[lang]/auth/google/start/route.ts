import { NextResponse, type NextRequest } from "next/server"

import { isLanguage } from "@/i18n/config"
import { getApiBaseUrl } from "@/lib/api-url"

export async function GET(
  request: NextRequest,
  context: RouteContext<"/[lang]/auth/google/start">
) {
  const { lang } = await context.params

  if (!isLanguage(lang)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
      cache: "no-store",
      redirect: "manual",
    })
    const location = response.headers.get("location")

    if (!location) {
      throw new Error("Google authorization URL is missing")
    }

    const googleUrl = new URL(location)

    if (
      googleUrl.protocol !== "https:" ||
      googleUrl.hostname !== "accounts.google.com"
    ) {
      throw new Error("Unexpected Google authorization URL")
    }

    googleUrl.searchParams.delete("login_hint")
    googleUrl.searchParams.delete("authuser")
    googleUrl.searchParams.delete("hd")
    googleUrl.searchParams.set("prompt", "select_account")
    return NextResponse.redirect(googleUrl)
  } catch {
    return NextResponse.redirect(
      new URL(`/${lang}/auth/google/callback?error=google`, request.url)
    )
  }
}
