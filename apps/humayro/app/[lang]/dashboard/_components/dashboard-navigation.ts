import {
  Analytics01Icon,
  Building03Icon,
  CreditCardIcon,
  Home01Icon,
  MapsIcon,
  Settings02Icon,
  ShoppingCart02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import type { DashboardAccess } from "@/lib/auth"

export type DashboardPermission =
  | "administration:manage"
  | "addresses:manage"
  | "analytics:read"
  | "dashboard:read"
  | "organization:manage-own"
  | "organizations:read-all"
  | "orders:read-own"
  | "payments:manage"
  | "profile:read"

export type DashboardNavigationItem = {
  active: boolean
  children?: DashboardNavigationItem[]
  href: string
  icon: IconSvgElement
  id: string
  label: string
  permission: DashboardPermission
}

type NavigationLabels = {
  administration: string
  addresses: string
  analytics: string
  dashboard: string
  districts: string
  orders: string
  payments: string
  organizations: string
  profile: string
  regions: string
}

export function getDashboardNavigationItems({
  access,
  canViewAnalytics,
  canManagePayments,
  labels,
  language,
  organizationId,
  organizationName,
  pathname,
}: {
  access: DashboardAccess
  canViewAnalytics: boolean
  canManagePayments: boolean
  labels: NavigationLabels
  language: string
  organizationId?: number
  organizationName?: string
  pathname: string
}): DashboardNavigationItem[] {
  const dashboardHref = `/${language}/dashboard`
  const administrationHref = `${dashboardHref}/adminstration`
  const analyticsHref = `${dashboardHref}/analytics`
  const addressesHref = `${dashboardHref}/addresses`
  const regionsHref = `${addressesHref}/regions`
  const districtsHref = `${addressesHref}/districts`
  const organizationsHref = `${dashboardHref}/organizations`
  const ordersHref = `${dashboardHref}/orders`
  const paymentsHref = `${dashboardHref}/payments`
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
      ...(canViewAnalytics
        ? [
            {
              active: pathname.startsWith(analyticsHref),
              href: analyticsHref,
              icon: Analytics01Icon,
              id: "analytics",
              label: labels.analytics,
              permission: "analytics:read" as const,
            },
          ]
        : []),
      {
        active: pathname.startsWith(administrationHref),
        href: administrationHref,
        icon: Settings02Icon,
        id: "administration",
        label: labels.administration,
        permission: "administration:manage",
      },
      {
        active: pathname.startsWith(addressesHref),
        children: [
          {
            active: pathname.startsWith(regionsHref),
            href: regionsHref,
            icon: MapsIcon,
            id: "regions",
            label: labels.regions,
            permission: "addresses:manage",
          },
          {
            active: pathname.startsWith(districtsHref),
            href: districtsHref,
            icon: MapsIcon,
            id: "districts",
            label: labels.districts,
            permission: "addresses:manage",
          },
        ],
        href: regionsHref,
        icon: MapsIcon,
        id: "addresses",
        label: labels.addresses,
        permission: "addresses:manage",
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

  if (access === "organization") {
    if (canViewAnalytics) {
      items.push({
        active: pathname.startsWith(analyticsHref),
        href: analyticsHref,
        icon: Analytics01Icon,
        id: "analytics",
        label: labels.analytics,
        permission: "analytics:read",
      })
    }

    if (organizationId) {
      items.push({
        active: pathname.startsWith(organizationsHref),
        href: `${organizationsHref}/${organizationId}`,
        icon: Building03Icon,
        id: "organization",
        label: organizationName || labels.organizations,
        permission: "organization:manage-own",
      })
    }
  }

  if (canManagePayments) {
    items.push({
      active: pathname.startsWith(paymentsHref),
      href: paymentsHref,
      icon: CreditCardIcon,
      id: "payments",
      label: labels.payments,
      permission: "payments:manage",
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
