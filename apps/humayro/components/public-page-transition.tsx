"use client"

import { usePathname } from "next/navigation"
import { ViewTransition } from "react"

function isDashboardPath(pathname: string) {
  const [, , section] = pathname.split("/")

  return section === "dashboard"
}

export function PublicPageTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (isDashboardPath(pathname)) {
    return children
  }

  return (
    <ViewTransition name="public-page-content" default="public-page-transition">
      {children}
    </ViewTransition>
  )
}
