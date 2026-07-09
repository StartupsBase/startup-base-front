"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string
  onChange: (value: string) => void
}

function formatPhoneNumber(value: string) {
  const digits = value.slice(0, 9)
  const parts = []

  if (digits.length > 0) {
    parts.push(digits.slice(0, 2))
  }

  if (digits.length > 2) {
    parts.push(digits.slice(2, 5))
  }

  if (digits.length > 5) {
    parts.push(digits.slice(5, 7))
  }

  if (digits.length > 7) {
    parts.push(digits.slice(7, 9))
  }

  return parts.join(" ")
}

function PhoneInput({
  className,
  value,
  onChange,
  ...props
}: PhoneInputProps) {
  return (
    <div
      className={cn(
        "flex h-11 items-center rounded-4xl border border-input bg-input/30 px-1.5 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className
      )}
    >
      <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-background px-3 text-sm font-medium text-foreground shadow-sm">
        <span aria-hidden="true" className="text-base leading-none">
          🇺🇿
        </span>
        <span>+998</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className="h-full w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        value={formatPhoneNumber(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 9)
          onChange(digits)
        }}
        {...props}
      />
    </div>
  )
}

export { PhoneInput }
