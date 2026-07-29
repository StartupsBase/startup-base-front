import {
  Building03Icon,
  Home01Icon,
  Settings02Icon,
  ShoppingCart02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import type { DashboardAccess } from "@/lib/auth"

export type DashboardPermission =
  | "administration:manage"
  | "dashboard:read"
  | "organization:manage-own"
  | "organizations:read-all"
  | "orders:read-own"
  | "profile:read"

export type DashboardNavigationItem = {
  active: boolean
  href: string
  icon: IconSvgElement
  id: string
  label: string
  permission: DashboardPermission
}

type NavigationLabels = {
  administration: string
  dashboard: string
  orders: string
  organizations: string
  profile: string
}

export function getDashboardNavigationItems({
  access,
  labels,
  language,
  organizationId,
  organizationName,
  pathname,
}: {
  access: DashboardAccess
  labels: NavigationLabels
  language: string
  organizationId?: number
  organizationName?: string
  pathname: string
}): DashboardNavigationItem[] {
  const dashboardHref = `/${language}/dashboard`
  const administrationHref = `${dashboardHref}/adminstration`
  const organizationsHref = `${dashboardHref}/organizations`
  const ordersHref = `${dashboardHref}/orders`
  const profileHref = `${dashboardHref}/profile`

  const items: DashboardNavigationItem[] = []

  if (access === "all") {
    items.push(
      {
        active: pathname === dashboardHref,
        href: dashboardHref,
        icon: Home01Icon,
        id: "dashboard",
        label: labels.dashboard,
        permission: "dashboard:read",
      },
      {
        active: pathname.startsWith(administrationHref),
        href: administrationHref,
        icon: Settings02Icon,
        id: "administration",
        label: labels.administration,
        permission: "administration:manage",
      },
      {
        active: pathname.startsWith(organizationsHref),
        href: organizationsHref,
        icon: Building03Icon,
        id: "organizations",
        label: labels.organizations,
        permission: "organizations:read-all",
      }
    )
  }

  if (access === "organization" && organizationId) {
    items.push({
      active: pathname.startsWith(organizationsHref),
      href: `${organizationsHref}/${organizationId}`,
      icon: Building03Icon,
      id: "organization",
      label: organizationName || labels.organizations,
      permission: "organization:manage-own",
    })
  }

  items.push(
    {
      active: pathname.startsWith(ordersHref),
      href: ordersHref,
      icon: ShoppingCart02Icon,
      id: "orders",
      label: labels.orders,
      permission: "orders:read-own",
    },
    {
      active: pathname.startsWith(profileHref),
      href: profileHref,
      icon: UserCircleIcon,
      id: "profile",
      label: labels.profile,
      permission: "profile:read",
    }
  )

  // When the API exposes granular permissions, filter `items` by `permission`
  // here. Sidebar rendering does not need to change.
  return items
}
