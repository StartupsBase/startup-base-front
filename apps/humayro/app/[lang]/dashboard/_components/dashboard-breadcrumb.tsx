import Link from "next/link"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

type DashboardBreadcrumbItem = {
  href?: string
  label: string
}

export function DashboardBreadcrumb({
  items,
  language,
}: {
  items: DashboardBreadcrumbItem[]
  language: string
}) {
  const crumbs: DashboardBreadcrumbItem[] = [
    { href: `/${language}/dashboard`, label: "Dashboard" },
    ...items,
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((item, index) => {
          const current = index === crumbs.length - 1

          return (
            <Fragment key={`${item.href ?? "current"}-${item.label}`}>
              <BreadcrumbItem>
                {current || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!current ? <BreadcrumbSeparator /> : null}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
