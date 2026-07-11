"use client"

import * as React from "react"
import { CheckmarkCircle02Icon, EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Input } from "@/components/input"

type PasswordInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
  valid?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, valid = false, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={isPasswordVisible ? "text" : "password"}
          disabled={disabled}
          className={`${valid ? "pr-20" : "pr-11"} ${className ?? ""}`}
        />
        {valid ? (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            aria-label="Valid password"
            className="pointer-events-none absolute right-11 top-1/2 size-5 -translate-y-1/2 text-emerald-600"
            strokeWidth={2}
          />
        ) : null}
        <button
          type="button"
          disabled={disabled}
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          aria-pressed={isPasswordVisible}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setIsPasswordVisible((visible) => !visible)}
        >
          <HugeiconsIcon
            icon={isPasswordVisible ? EyeOffIcon : EyeIcon}
            aria-hidden="true"
            className="size-5"
            strokeWidth={2}
          />
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"
