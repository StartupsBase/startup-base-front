"use client"

import * as React from "react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Input } from "@/components/input"

type PasswordInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
  valid?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, valid = false, ...props }, ref) => (
    <div className="relative">
      <Input ref={ref} type="password" className={`pr-11 ${className ?? ""}`} {...props} />
      {valid ? (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          aria-label="Valid password"
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-emerald-600"
          strokeWidth={2}
        />
      ) : null}
    </div>
  )
)

PasswordInput.displayName = "PasswordInput"
