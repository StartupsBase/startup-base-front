import Link from "next/link"
import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

function Logo({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect width="48" height="48" rx="15" fill="currentColor" />
      <path
        d="M14 13.5V34.5M34 13.5V34.5M14 24H34"
        stroke="var(--primary-foreground)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="34" cy="13.5" r="3" fill="var(--primary-foreground)" />
    </svg>
  )
}

function LogoBrand({ className, ...props }: ComponentProps<"svg">) {
  return (
    <Link href="/" aria-label="Humayro" className="flex items-center font-semibold tracking-tight">
      <Logo className={cn("h-10 w-10", className)} {...props} />
      <span className="ml-2 text-lg font-bold tracking-tight">Humayro</span>
    </Link>
  )
}

export { Logo, LogoBrand }
