import { NextResponse, type NextRequest } from "next/server"

import {
  defaultLanguage,
  getLanguage,
  isLanguage,
  languageCookieName,
  languages,
} from "./i18n/config"

function getPreferredLanguage(request: NextRequest) {
  const cookieLanguage = request.cookies.get(languageCookieName)?.value

  if (cookieLanguage && isLanguage(cookieLanguage)) {
    return cookieLanguage
  }

  const acceptedLanguages = request.headers
    .get("accept-language")
    ?.split(",")
    .map((item) => item.split(";")[0]?.trim())
    .filter(Boolean)

  const acceptedLanguage = acceptedLanguages?.find((item) =>
    isLanguage(getLanguage(item))
  )

  return acceptedLanguage ? getLanguage(acceptedLanguage) : defaultLanguage
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const pathnameHasLanguage = languages.some(
    (language) => pathname === `/${language}` || pathname.startsWith(`/${language}/`)
  )

  if (pathnameHasLanguage) {
    const language = languages.find(
      (item) => pathname === `/${item}` || pathname.startsWith(`/${item}/`)
    )
    const isDashboard =
      pathname === `/${language}/dashboard` ||
      pathname.startsWith(`/${language}/dashboard/`)
    const isProtectedMiniAppRoute =
      pathname === `/${language}/account` ||
      pathname.startsWith(`/${language}/account/`) ||
      pathname === `/${language}/admin` ||
      pathname.startsWith(`/${language}/admin/`)

    if (
      (isDashboard || isProtectedMiniAppRoute) &&
      !request.cookies.get("humayro_access_token")?.value
    ) {
      const url = request.nextUrl.clone()
      url.pathname = `/${language}/login`
      url.searchParams.set("next", pathname)

      return NextResponse.redirect(url)
    }

    return
  }

  const language = getPreferredLanguage(request)
  const url = request.nextUrl.clone()

  url.pathname = `/${language}${pathname === "/" ? "" : pathname}`

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
