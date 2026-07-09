import { NextResponse, type NextRequest } from "next/server"

import { isLanguage, languageCookieName } from "@/i18n/config"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    language?: unknown
  } | null

  if (!isLanguage(body?.language)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 })
  }

  const response = NextResponse.json({ language: body.language })

  response.cookies.set(languageCookieName, body.language, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  return response
}
