import { NextResponse, type NextRequest } from "next/server"

import { defaultLanguage, getLanguage, languageCookieName } from "@/i18n/config"
import type { JwtDTO } from "@/lib/api"
import { getApiBaseUrl } from "@/lib/api-url"
import {
  authTokenCookieName,
  authTokenMaxAgeDays,
  getPostLoginPath,
} from "@/lib/auth"

function getErrorRedirect(request: NextRequest, language: string) {
  return new URL(`/${language}/auth/google/callback?error=google`, request.url)
}

export async function GET(request: NextRequest) {
  const language = getLanguage(
    request.cookies.get(languageCookieName)?.value ?? defaultLanguage
  )
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(getErrorRedirect(request, language))
  }

  try {
    const callbackUrl = new URL("/api/auth/google/callback", getApiBaseUrl())
    callbackUrl.searchParams.set("code", code)

    const callbackResponse = await fetch(callbackUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })

    if (!callbackResponse.ok) {
      return NextResponse.redirect(getErrorRedirect(request, language))
    }

    const session = (await callbackResponse.json()) as JwtDTO

    if (!session.accessToken) {
      return NextResponse.redirect(getErrorRedirect(request, language))
    }

    const response = NextResponse.redirect(
      new URL(getPostLoginPath(language, session.user?.roles), request.url)
    )

    response.cookies.set(authTokenCookieName, session.accessToken, {
      expires: new Date(
        Date.now() + authTokenMaxAgeDays * 24 * 60 * 60 * 1000
      ),
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    })

    return response
  } catch {
    return NextResponse.redirect(getErrorRedirect(request, language))
  }
}
