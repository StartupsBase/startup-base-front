import type { UserDTO } from "@/lib/api"

export function isAdminUser(user: UserDTO | null | undefined) {
  return (
    user?.roles?.some(
      (role) => role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN"
    ) ?? false
  )
}

export function getPostAuthDestination(
  language: string,
  user: UserDTO | null | undefined
) {
  return isAdminUser(user) ? `/${language}/dashboard` : `/${language}`
}
