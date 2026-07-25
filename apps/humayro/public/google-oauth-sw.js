const callbackPath = "/api/auth/google/callback"
const tokenCookieName = "humayro_access_token"
const returnPathKey = "humayro_google_return_path"
const tokenMaxAge = 7 * 24 * 60 * 60

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  if (
    event.request.mode !== "navigate" ||
    url.origin !== self.location.origin ||
    url.pathname !== callbackPath
  ) {
    return
  }

  event.respondWith(handleGoogleCallback(event.request))
})

async function handleGoogleCallback(request) {
  try {
    const response = await fetch(request)

    if (response.redirected) {
      return Response.redirect(response.url, 303)
    }

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) return response

    const session = await response.json()
    if (!response.ok || !session?.accessToken) {
      return createCompletionPage(null)
    }

    return createCompletionPage(session)
  } catch {
    return createCompletionPage(null)
  }
}

function createCompletionPage(session) {
  const serializedSession = JSON.stringify(session).replace(/</g, "\\u003c")
  const script = `
    const session = ${serializedSession};
    const localeMatch = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    const localeValue = localeMatch ? decodeURIComponent(localeMatch[1]) : "ru";
    const language = localeValue === "uz" ? "uz" : "ru";

    if (!session?.accessToken) {
      window.location.replace("/" + language + "/auth/google/callback?error=google");
    } else {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = "${tokenCookieName}=" + encodeURIComponent(session.accessToken)
        + "; Path=/; Max-Age=${tokenMaxAge}; SameSite=Lax" + secure;

      const storedPath = sessionStorage.getItem("${returnPathKey}");
      sessionStorage.removeItem("${returnPathKey}");
      const safeStoredPath = storedPath?.startsWith("/" + language + "/")
        && !storedPath.startsWith("//") ? storedPath : null;
      const dashboardRoles = ["ROLE_ADMIN", "ROLE_EMPLOYER", "ROLE_SUPER_ADMIN"];
      const hasDashboardRole = session.user?.roles?.some((role) =>
        dashboardRoles.includes(role)
      );
      const destination = safeStoredPath
        ?? (hasDashboardRole ? "/" + language + "/dashboard" : "/" + language);

      window.location.replace(destination);
    }
  `

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Humayro</title></head><body><script>${script}</script></body></html>`,
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
      },
    }
  )
}
