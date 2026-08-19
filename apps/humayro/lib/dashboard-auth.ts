import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import type { UserDTO } from "@/lib/api"
import { getApiBaseUrl } from "@/lib/api-url"
import {
  authTokenCookieName,
  getDashboardAccess,
  getDashboardLandingPath,
} from "@/lib/auth"

type DashboardPage =
  | "administration"
  | "dashboard"
  | "organization"
  | "organizations"
  | "orders"
  | "payments"
  | "profile"

const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(authTokenCookieName)?.value

  if (!token) return null

  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401 || response.status === 403) return null
  if (!response.ok) throw new Error("Unable to verify the current user")

  return (await response.json()) as UserDTO
})

export async function requireAuthenticatedUser(language: string) {
  const user = await getCurrentUser()

  if (!user) redirect(`/${language}/login`)

  return user
}

export async function requireDashboardPageAccess({
  language,
  organizationId,
  page,
}: {
  language: string
  organizationId?: number
  page: DashboardPage
}) {
  const user = await requireAuthenticatedUser(language)
  const access = getDashboardAccess(user.roles)
  const canManagePayments = user.roles?.some(
    (role) => role === "ROLE_EMPLOYER" || role === "ROLE_SUPER_ADMIN"
  )
  const canAccess =
    page === "profile" ||
    page === "orders" ||
    (page === "payments" && canManagePayments) ||
    access === "all" ||
    (access === "organization" &&
      page === "organization" &&
      organizationId === user.organizationId)

  if (!canAccess) redirect(getDashboardLandingPath(language, user))

  return user
}
