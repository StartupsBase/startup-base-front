export const authTokenCookieName = "humayro_access_token"
export const authTokenMaxAgeDays = 7
export const googleReturnPathKey = "humayro_google_return_path"

export const userRoles = [
  "ROLE_ADMIN",
  "ROLE_USER",
  "ROLE_EMPLOYER",
  "ROLE_SUPER_ADMIN",
] as const

export type UserRole = (typeof userRoles)[number]
export type DashboardAccess = "all" | "organization" | "profile"

export function hasDashboardRole(roles?: string[]) {
  return getDashboardAccess(roles) !== "profile"
}

export function getDashboardAccess(roles?: string[]): DashboardAccess {
  if (roles?.includes("ROLE_SUPER_ADMIN")) return "all"
  if (roles?.includes("ROLE_ADMIN")) return "organization"

  return "profile"
}

export function getDashboardLandingPath(
  language: string,
  user: { organizationId?: number; roles?: string[] }
) {
  const access = getDashboardAccess(user.roles)

  if (access === "all") return `/${language}/dashboard`
  if (access === "organization" && user.organizationId) {
    return `/${language}/dashboard/organizations/${user.organizationId}`
  }

  return `/${language}/dashboard/profile`
}

export function getPostLoginPath(language: string, roles?: string[]) {
  if (hasDashboardRole(roles)) return `/${language}/dashboard`
  if (roles?.includes("ROLE_EMPLOYER")) {
    return `/${language}/dashboard/profile`
  }

  return `/${language}`
}
