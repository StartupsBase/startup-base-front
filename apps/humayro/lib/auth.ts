export const authTokenCookieName = "humayro_access_token"
export const authTokenMaxAgeDays = 7
export const googleReturnPathKey = "humayro_google_return_path"

const dashboardRoles = new Set([
  "ROLE_ADMIN",
  "ROLE_EMPLOYER",
  "ROLE_SUPER_ADMIN",
])

export function getPostLoginPath(language: string, roles?: string[]) {
  return roles?.some((role) => dashboardRoles.has(role))
    ? `/${language}/dashboard`
    : `/${language}`
}
